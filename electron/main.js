import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import os from 'node:os'
import Store from 'electron-store'
import { v4 as uuidv4 } from 'uuid'
import Papa from 'papaparse'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import updater from 'electron-updater'
const { autoUpdater } = updater

const APP_DIR_NAME = 'StudentDesk'
const STORE_NAME = 'studentdesk-data'
const BACKUPS_DIR_NAME = 'backups'
const MAX_BACKUPS = 10
const HISTORY_KEY = 'historyClearedAt';

/* -------------------- Logger for updates -------------------- */
function logUpdate(message) {
  const logFile = path.join(os.homedir(), 'studentdesk-updater.log')
  const fullMessage = `[${new Date().toISOString()}] ${message}\n`
  console.log('[Updater]', message)
  try {
    fs.appendFileSync(logFile, fullMessage)
  } catch (e) {
    console.warn('Impossible d’écrire le log updater:', e)
  }
}

/* -------------------- Data dirs -------------------- */
function iCloudRootPath() {
  const home = os.homedir()
  const p = path.join(home, 'Library', 'Mobile Documents', 'com~apple~CloudDocs')
  try {
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return p
  } catch {}
  return null
}
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
  return p
}
function pickDataDir() {
  const iCloudRoot = iCloudRootPath()
  if (iCloudRoot) {
    const appDir = ensureDir(path.join(iCloudRoot, APP_DIR_NAME))
    const backupsDir = ensureDir(path.join(appDir, BACKUPS_DIR_NAME))
    return { baseDir: appDir, backupsDir, isICloud: true }
  }
  const base = app.getPath('userData')
  const appDir = ensureDir(path.join(base, APP_DIR_NAME))
  const backupsDir = ensureDir(path.join(appDir, BACKUPS_DIR_NAME))
  return { baseDir: appDir, backupsDir, isICloud: false }
}
function defaultLocalStorePath() {
  const base = app.getPath('userData')
  const candidate1 = path.join(base, `${STORE_NAME}.json`)
  const candidate2 = path.join(base, APP_DIR_NAME, `${STORE_NAME}.json`)
  if (fs.existsSync(candidate2)) return candidate2
  if (fs.existsSync(candidate1)) return candidate1
  return null
}
function currentStoreFile(dir) {
  return path.join(dir, `${STORE_NAME}.json`)
}
function migrateIfNeeded(targetDir) {
  const targetFile = currentStoreFile(targetDir)
  if (fs.existsSync(targetFile)) return
  const oldFile = defaultLocalStorePath()
  if (oldFile && fs.existsSync(oldFile)) {
    try {
      ensureDir(targetDir)
      fs.copyFileSync(oldFile, targetFile)
      console.log(`[StudentDesk] Migrated data file to: ${targetFile}`)
    } catch (e) {
      console.error('Migration to iCloud failed:', e)
    }
  }
}
function writeBackup(backupsDir, dataObj) {
  try {
    ensureDir(backupsDir)
    const ts = new Date().toISOString().replace(/[:]/g, '-')
    const file = path.join(backupsDir, `students-${ts}.json`)
    fs.writeFileSync(file, JSON.stringify(dataObj, null, 2), 'utf8')
    const files = fs.readdirSync(backupsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({ name: f, time: fs.statSync(path.join(backupsDir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time)
    files.slice(MAX_BACKUPS).forEach(f => {
      try { fs.unlinkSync(path.join(backupsDir, f.name)) } catch {}
    })
  } catch (e) {
    console.error('Backup write failed:', e)
  }
}

let dataDirs = null
let store = null
let mainWindow = null

function initStore() {
  dataDirs = pickDataDir()
  migrateIfNeeded(dataDirs.baseDir)
  store = new Store({
    name: STORE_NAME,
    cwd: dataDirs.baseDir,
    defaults: { students: [], [HISTORY_KEY]: null }
  })

  // ✅ Conversion one-shot: transforme d'éventuels soft deletes en hard deletes
  try {
    const current = store.get('students') || []
    const cleaned = hardPurgeDeleted(current)
    if (JSON.stringify(current) !== JSON.stringify(cleaned)) {
      saveStudents(cleaned, 'maintenance:hard-purge')
      console.log('[StudentDesk] Hard purge effectué (soft deletes nettoyés).')
    }
  } catch (e) {
    console.warn('Hard purge failed:', e)
  }
}

/* -------------------- Helpers -------------------- */
function uid() { return uuidv4() }
function loadStudents() { return store.get('students') }
function saveStudents(students, action = 'write') {
  store.set('students', students)
  writeBackup(dataDirs.backupsDir, { students })
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('store:saved', {
        action,
        icloud: !!dataDirs?.isICloud,
        when: new Date().toISOString()
      })
    }
  } catch (e) {
    console.error('Failed to send store:saved event:', e)
  }
}
function findStudentIndex(students, id) { return students.findIndex(s => s.id === id) }

/* -------------------- Hard purge (sécurité) -------------------- */
// Supprime définitivement de "students" et "lessons" tout ce qui a un deletedAt
function hardPurgeDeleted(students) {
  if (!Array.isArray(students)) return []
  const cleaned = []
  for (const s of students) {
    if (s?.deletedAt) {
      // étudiant marqué supprimé → on l'ignore (hard delete)
      continue
    }
    const copy = { ...s }
    // purge des leçons marquées supprimées
    copy.lessons = Array.isArray(copy.lessons)
      ? copy.lessons.filter(l => !l?.deletedAt)
      : []
    // sécurité: normalise les tableaux utilisés ailleurs
    copy.billingHistory = Array.isArray(copy.billingHistory) ? copy.billingHistory : []
    cleaned.push(copy)
  }
  return cleaned
}

/* -------------------- Photos -------------------- */
function deletePhotoIfExists(photoPath) {
  if (!photoPath) return
  try {
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath)
      console.log('[StudentDesk] Photo supprimée:', photoPath)
    }
  } catch (e) {
    console.warn('Erreur suppression photo:', e)
  }
}

/* -------------------- Billing -------------------- */
function recomputeBillingProgress(student) {
  const history = Array.isArray(student.billingHistory) ? student.billingHistory : []
  const lessons = Array.isArray(student.lessons) ? student.lessons : []
  const countById = new Map()
  for (const l of lessons) {
    if (l?.billingId) {
      countById.set(l.billingId, (countById.get(l.billingId) || 0) + 1)
    }
  }
  const nowISO = new Date().toISOString()
  for (const c of history) {
    const total = c.mode === 'package' ? (c.totalLessons || 0) : 1
    const consumed = countById.get(c.id) || 0
    const isCompleted = total > 0 && consumed >= total
    c.consumedLessons = consumed
    c.completed = isCompleted
    if (isCompleted && !c.completedAt) c.completedAt = nowISO
    if (!isCompleted) c.completedAt = null
    c.updatedAt = nowISO
  }
}
function latestOpenContract(student) {
  const history = Array.isArray(student.billingHistory) ? student.billingHistory : []
  const sorted = [...history].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  return sorted.find(c => !c.completed)
}

/* -------------------- Window -------------------- */
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 720,
    minHeight: 480,
    backgroundColor: '#0b0b0b',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_START_URL) {
    await mainWindow.loadURL(process.env.ELECTRON_START_URL)
  } else {
    const indexPath = path.resolve(__dirname, '..', 'dist', 'index.html')
    await mainWindow.loadFile(indexPath, { search: `?v=${Date.now()}` })
  }

  mainWindow.webContents.on('did-fail-load', (_e, errorCode, errorDesc, validatedURL) => {
    console.error('[StudentDesk] did-fail-load', { errorCode, errorDesc, validatedURL })
  })
  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    console.error('[StudentDesk] render-process-gone', details)
  })

  mainWindow.on('focus', () => mainWindow.webContents.send('app:focus'))
}

/* -------------------- App lifecycle -------------------- */
app.whenReady().then(() => {
  initStore()
  createWindow()

  // Auto-update
  autoUpdater.checkForUpdatesAndNotify()

  autoUpdater.on('checking-for-update', () => {
    logUpdate('Vérification de mise à jour...')
    if (mainWindow) mainWindow.webContents.send('update:checking')
  })
  autoUpdater.on('update-available', () => {
    logUpdate('Mise à jour disponible, téléchargement en cours...')
    if (mainWindow) mainWindow.webContents.send('update:available')
  })
  autoUpdater.on('update-not-available', () => {
    logUpdate('Pas de nouvelle mise à jour.')
    if (mainWindow) mainWindow.webContents.send('update:none')
  })
  autoUpdater.on('update-downloaded', () => {
    logUpdate('Mise à jour téléchargée, sera installée au redémarrage.')
    if (mainWindow) mainWindow.webContents.send('update:downloaded')
  })
  autoUpdater.on('error', (err) => {
    logUpdate('Erreur de mise à jour: ' + err.toString())
    if (mainWindow) mainWindow.webContents.send('update:error', err.toString())
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

/* -------------------- IPC: Students CRUD -------------------- */
ipcMain.handle('students:list', async () => {
  const students = loadStudents()
  return [...students].sort((a, b) => {
    const ln = a.lastName.localeCompare(b.lastName)
    if (ln !== 0) return ln
    return a.firstName.localeCompare(b.firstName)
  })
})

ipcMain.handle('students:create', async (_evt, payload) => {
  const students = loadStudents()
  const now = new Date().toISOString()
  const student = {
    id: uid(),
    firstName: payload.firstName || '',
    lastName: payload.lastName || '',
    description: payload.description || '',
    email: payload.email || '',
    isActive: Boolean(payload.isActive),
    photo: payload.photo || null,
    sheet: { createdAt: now },
    lessons: [],
    billingHistory: [],
    updatedAt: null
  }
  students.push(student)
  saveStudents(students, 'students:create')
  return student
})

ipcMain.handle('students:update', async (_evt, id, patch) => {
  const students = loadStudents()
  const idx = findStudentIndex(students, id)
  if (idx === -1) throw new Error('Student not found')

  const merged = { ...students[idx], ...patch, updatedAt: new Date().toISOString() }
  if (patch?.lessons || patch?.billingHistory) {
    recomputeBillingProgress(merged)
  }

  students[idx] = merged
  saveStudents(students, 'students:update')
  return students[idx]
})

ipcMain.handle('students:delete', async (_evt, id) => {
  const students = loadStudents()
  const idx = findStudentIndex(students, id)
  if (idx === -1) throw new Error('Student not found')

  const student = students[idx]
  // supprime la photo éventuelle
  deletePhotoIfExists(student.photo)

  // ✅ HARD DELETE: on retire l'étudiant du tableau
  students.splice(idx, 1)
  saveStudents(students, 'students:delete:hard')
  return id
})

ipcMain.handle('students:get', async (_evt, id) => {
  const students = loadStudents()
  const s = students.find(x => x.id === id)
  if (!s) throw new Error('Student not found')

  s.billingHistory ||= []
  recomputeBillingProgress(s)

  const lessons = [...(s.lessons || [])]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return { ...s, lessons }
})

/* -------------------- IPC: Lessons CRUD -------------------- */
ipcMain.handle('lessons:add', async (_evt, studentId, payload) => {
  const students = loadStudents()
  const idx = findStudentIndex(students, studentId)
  if (idx === -1) throw new Error('Student not found')

  const now = new Date().toISOString()
  const student = students[idx]

  // billingId prioritaire depuis payload, sinon dernier contrat ouvert
  let targetBillingId = payload.billingId || null
  if (!targetBillingId) {
    const targetContract = latestOpenContract(student)
    targetBillingId = targetContract ? targetContract.id : null
  }

  const lesson = {
    id: uid(),
    createdAt: now,
    updatedAt: null,
    comment: payload.comment || '',
    homework: payload.homework || '',
    tags: payload.tags || [],
    billingId: targetBillingId
  }

  student.lessons.push(lesson)
  recomputeBillingProgress(student)

  students[idx] = student
  saveStudents(students, 'lessons:add')

  const lessons = [...student.lessons]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return { ...student, lessons }
})

ipcMain.handle('lessons:update', async (_evt, studentId, lessonId, patch) => {
  const students = loadStudents()
  const idx = findStudentIndex(students, studentId)
  if (idx === -1) throw new Error('Student not found')

  const student = students[idx]
  const lidx = (student.lessons || []).findIndex(l => l.id === lessonId)
  if (lidx === -1) throw new Error('Lesson not found')

  student.lessons[lidx] = {
    ...student.lessons[lidx],
    ...patch,
    updatedAt: new Date().toISOString()
  }

  if ('billingId' in patch) {
    recomputeBillingProgress(student)
  }

  students[idx] = student
  saveStudents(students, 'lessons:update')
  return student.lessons[lidx]
})

ipcMain.handle('lessons:delete', async (_evt, studentId, lessonId) => {
  const students = loadStudents()
  const idx = findStudentIndex(students, studentId)
  if (idx === -1) throw new Error('Student not found')

  const student = students[idx]
  const lessons = Array.isArray(student.lessons) ? student.lessons : []
  const lidx = lessons.findIndex(l => l.id === lessonId)
  if (lidx === -1) throw new Error('Lesson not found')

  // ✅ HARD DELETE: on retire la leçon du tableau
  lessons.splice(lidx, 1)

  // Recalcule la facturation liée
  recomputeBillingProgress(student)

  student.lessons = lessons
  students[idx] = student
  saveStudents(students, 'lessons:delete:hard')
  return lessonId
})

/* -------------------- IPC: Import CSV -------------------- */
ipcMain.handle('students:importCSV', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Importer un fichier CSV',
    filters: [{ name: 'CSV files', extensions: ['csv'] }],
    properties: ['openFile']
  })
  if (canceled || !filePaths.length) return { count: 0 }

  const file = fs.readFileSync(filePaths[0], 'utf-8')
  const delimiter = file.includes(';') ? ';' : ','

  const { data } = Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    delimiter
  })

  console.log('[StudentDesk] CSV import parsed headers:', Object.keys(data[0] || {}))

  let students = loadStudents()
  let count = 0

  for (const row of data) {
    if (!row.firstName && !row.lastName) continue

    const now = new Date().toISOString()
    const student = {
      id: uid(),
      firstName: row.firstName?.trim() || '',
      lastName: row.lastName?.trim() || '',
      description: row.description?.trim() || '',
      email: row.email?.trim() || '',
      isActive:
        String(row.isActive).toLowerCase() === 'true' ||
        String(row.isActive).toLowerCase() === 'oui' ||
        String(row.isActive) === '1',
      photo: null,
      sheet: { createdAt: now },
      lessons: [],
      billingHistory: [],
      updatedAt: null
    }
    students.push(student)
    count++
  }

  saveStudents(students, 'students:importCSV')
  return { count }
})

/* -------------------- IPC: Updates -------------------- */
ipcMain.handle("update:installNow", () => {
  logUpdate("Installation immédiate de la mise à jour demandée.")
  autoUpdater.quitAndInstall()
})

ipcMain.handle("app:getVersion", () => app.getVersion())

/* -------------------- IPC: History -------------------- */
ipcMain.handle('history:clear', async () => {
  const students = loadStudents() || []
  const now = new Date().toISOString()

  for (const s of students) {
    s.updatedAt = null
    if (Array.isArray(s.lessons)) {
      for (const l of s.lessons) {
        l.updatedAt = null
      }
    }
  }

  saveStudents(students, 'history:clear')
  store.set(HISTORY_KEY, now)

  // ✅ Notify renderer immédiatement
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('history:cleared', { clearedAt: now })
  }

  return { clearedAt: now }
})

ipcMain.handle('history:getClearedAt', async () => {
  return store.get(HISTORY_KEY) || null
})

/* -------------------- IPC: Settings -------------------- */
ipcMain.handle("settings:get", () => {
  return {
    theme: store.get("theme", "dark"),
    lessonDuration: store.get("lessonDuration", 60),
    currency: store.get("currency", "EUR"), // ⚡ changé "€" en code standard
  }
})

ipcMain.handle("settings:save", (_evt, newSettings) => {
  if (newSettings.theme !== undefined) store.set("theme", newSettings.theme)
  if (newSettings.lessonDuration !== undefined) store.set("lessonDuration", newSettings.lessonDuration)
  if (newSettings.currency !== undefined) store.set("currency", newSettings.currency)

  const updated = {
    theme: store.get("theme", "dark"),
    lessonDuration: store.get("lessonDuration", 60),
    currency: store.get("currency", "EUR"),
  }

  // 🔔 notifier le renderer (App.tsx) → toast
  mainWindow?.webContents.send("store:saved", {
    action: "settings",
    icloud: !!dataDirs?.isICloud,
    when: new Date().toISOString()
  })

  return updated
})
