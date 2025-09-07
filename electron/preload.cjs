const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("studentApi", {
  listStudents: () => ipcRenderer.invoke("students:list"),
  createStudent: (payload) => ipcRenderer.invoke("students:create", payload),
  updateStudent: (id, patch) => ipcRenderer.invoke("students:update", id, patch),
  deleteStudent: (id) => ipcRenderer.invoke("students:delete", id),
  getStudent: (id) => ipcRenderer.invoke("students:get", id),

  addLesson: (studentId, payload) => ipcRenderer.invoke("lessons:add", studentId, payload),
  updateLesson: (studentId, lessonId, patch) =>
    ipcRenderer.invoke("lessons:update", studentId, lessonId, patch),
  deleteLesson: (studentId, lessonId) =>
    ipcRenderer.invoke("lessons:delete", studentId, lessonId),

  importCSV: () => ipcRenderer.invoke("students:importCSV"),

  onAppFocus: (cb) => ipcRenderer.on("app:focus", cb),

  onStoreSaved: (cb) => {
    const listener = (_evt, payload) => cb(payload)
    ipcRenderer.on("store:saved", listener)
    return () => ipcRenderer.removeListener("store:saved", listener)
  },

  onUpdate: (channel, cb) => {
    const listener = (event, payload) => cb(event, payload)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },

  installUpdateNow: () => ipcRenderer.invoke("update:installNow"),

  getVersion: () => ipcRenderer.invoke("app:getVersion"),
  clearHistory: () => ipcRenderer.invoke('history:clear'),
  getHistoryClearedAt: () => ipcRenderer.invoke('history:getClearedAt')
})