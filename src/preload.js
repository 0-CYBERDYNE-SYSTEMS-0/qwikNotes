const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  saveNote: (index, text) => ipcRenderer.invoke('save-note', index, text),
  copyNote: (text) => ipcRenderer.invoke('copy-note', text),
  closeWindow: () => ipcRenderer.invoke('close-editor')
});
