// preload.js (CJS obligatoire pour Electron)
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

  // App events
  onAppFocus: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('app:focus', handler)
    return () => ipcRenderer.removeListener('app:focus', handler)
  },

  // Store saved event
  onStoreSaved: (cb) => {
    const handler = (_evt, payload) => cb(payload)
    ipcRenderer.on('store:saved', handler)
    return () => ipcRenderer.removeListener('store:saved', handler)
  }
})