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

const APP_DIR_NAME = 'StudentDesk'
const STORE_NAME = 'studentdesk-data'
const BACKUPS_DIR_NAME = 'backups'
const MAX_BACKUPS = 10

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
    defaults: { students: [] }
  })
}

function uid() {
  return uuidv4()
}
function loadStudents() {
  return store.get('students')
}
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
function findStudentIndex(students, id) {
  return students.findIndex(s => s.id === id)
}

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

app.whenReady().then(() => {
  initStore()
  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

/* -------------------- Helpers: photos -------------------- */
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
    updatedAt: null,
    deletedAt: null
  }
  students.push(student)
  saveStudents(students, 'students:create')
  return student
})

ipcMain.handle('students:update', async (_evt, id, patch) => {
  const students = loadStudents()
  const idx = findStudentIndex(students, id)
  if (idx === -1) throw new Error('Student not found')
  students[idx] = {
    ...students[idx],
    ...patch,
    updatedAt: new Date().toISOString()
  }
  saveStudents(students, 'students:update')
  return students[idx]
})

ipcMain.handle('students:delete', async (_evt, id) => {
  const students = loadStudents()
  const idx = findStudentIndex(students, id)
  if (idx === -1) throw new Error('Student not found')

  const student = students[idx]
  student.deletedAt = new Date().toISOString()
  // supprimer photo du disque si elle existe
  deletePhotoIfExists(student.photo)

  saveStudents(students, 'students:delete')
  return student.id
})

ipcMain.handle('students:get', async (_evt, id) => {
  const students = loadStudents()
  const s = students.find(x => x.id === id)
  if (!s) throw new Error('Student not found')
  const lessons = [...s.lessons].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { ...s, lessons }
})

/* -------------------- IPC: Lessons CRUD -------------------- */
ipcMain.handle('lessons:add', async (_evt, studentId, payload) => {
  const students = loadStudents()
  const idx = findStudentIndex(students, studentId)
  if (idx === -1) throw new Error('Student not found')
  const now = new Date().toISOString()
  const lesson = {
    id: uid(),
    createdAt: now,
    updatedAt: null,
    deletedAt: null,
    comment: payload.comment || '',
    homework: payload.homework || '',
    tags: payload.tags || []
  }
  students[idx].lessons.push(lesson)
  saveStudents(students, 'lessons:add')
  const lessons = [...students[idx].lessons].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { ...students[idx], lessons }
})

ipcMain.handle('lessons:update', async (_evt, studentId, lessonId, patch) => {
  const students = loadStudents()
  const idx = findStudentIndex(students, studentId)
  if (idx === -1) throw new Error('Student not found')

  const lidx = students[idx].lessons.findIndex(l => l.id === lessonId)
  if (lidx === -1) throw new Error('Lesson not found')

  students[idx].lessons[lidx] = {
    ...students[idx].lessons[lidx],
    ...patch,
    updatedAt: new Date().toISOString()
  }

  saveStudents(students, 'lessons:update')
  return students[idx].lessons[lidx]
})

ipcMain.handle('lessons:delete', async (_evt, studentId, lessonId) => {
  const students = loadStudents()
  const idx = findStudentIndex(students, studentId)
  if (idx === -1) throw new Error('Student not found')

  const lidx = students[idx].lessons.findIndex(l => l.id === lessonId)
  if (lidx === -1) throw new Error('Lesson not found')

  students[idx].lessons[lidx].deletedAt = new Date().toISOString()

  saveStudents(students, 'lessons:delete')
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
    if (!row.firstName && !row.lastName) continue // ignorer lignes vides

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
      updatedAt: null,
      deletedAt: null
    }
    students.push(student)
    count++
  }

  saveStudents(students, 'students:importCSV')
  return { count }
})