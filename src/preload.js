// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { ipcRenderer, contextBridge } = require("electron")

contextBridge.exposeInMainWorld('electronApi', {
  startScrap: async (data) => await ipcRenderer.invoke('scrap:start', data),
  handleToastUpdate: async (callback) => await ipcRenderer.on('toast:update', (e, data) => callback(data)),
  handleScrapEnd: async (callback) => await ipcRenderer.on('scrap:end', (e, data) => callback(data)),
})