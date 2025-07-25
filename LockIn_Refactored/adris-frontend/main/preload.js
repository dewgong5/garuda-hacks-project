const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openMiniWindow: () => ipcRenderer.send('open-mini-window'),
  launchLockin: () => ipcRenderer.send('launch-lockin')
});
