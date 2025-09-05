const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('studentApi', {
  // Students
  listStudents: () => ipcRenderer.invoke('students:list'),
  createStudent: (payload) => ipcRenderer.invoke('students:create', payload),
  updateStudent: (id, patch) => ipcRenderer.invoke('students:update', id, patch),
  deleteStudent: (id) => ipcRenderer.invoke('students:delete', id),
  getStudent: (id) => ipcRenderer.invoke('students:get', id),

  // Lessons
  addLesson: (studentId, payload) => ipcRenderer.invoke('lessons:add', studentId, payload),
  deleteLesson: (studentId, lessonId) => ipcRenderer.invoke('lessons:delete', studentId, lessonId),
  updateLesson: (studentId, lessonId, patch) =>
    ipcRenderer.invoke('lessons:update', studentId, lessonId, patch),

  // CSV import
  importCSV: () => ipcRenderer.invoke('students:importCSV'),

  // App events
  onAppFocus: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('app:focus', handler)
    return () => ipcRenderer.removeListener('app:focus', handler)
  },

  onStoreSaved: (cb) => {
    const handler = (_evt, payload) => cb(payload)
    ipcRenderer.on('store:saved', handler)
    return () => ipcRenderer.removeListener('store:saved', handler)
  }
})