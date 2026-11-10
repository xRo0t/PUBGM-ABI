const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launcher', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),

  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: patch => ipcRenderer.invoke('config:save', patch),

  browseGame: () => ipcRenderer.invoke('game:browse'),
  startGame: () => ipcRenderer.invoke('game:start'),
  verifyGame: () => ipcRenderer.invoke('game:verify'),
  openGameFolder: () => ipcRenderer.invoke('game:open-folder')
});
