const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  controlPlayback: (action) => ipcRenderer.invoke('control-playback', action),
  getCurrentSong: () => ipcRenderer.invoke('get-current-song'),
  setVolume: (volume) => ipcRenderer.invoke('set-volume', volume)
}); 