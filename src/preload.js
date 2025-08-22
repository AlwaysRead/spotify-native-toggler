const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  controlPlayback: (action) => ipcRenderer.invoke("control-playback", action),
  getCurrentSong: () => ipcRenderer.invoke("get-current-song"),
  setVolume: (volume) => ipcRenderer.invoke("set-volume", volume),
  getCurrentVolume: () => ipcRenderer.invoke("get-current-volume"),
  hideWindow: () => ipcRenderer.invoke("hide-window"),

  // Event listeners
  onMuteStateChanged: (callback) =>
    ipcRenderer.on("mute-state-changed", callback),
  removeMuteStateListener: () =>
    ipcRenderer.removeAllListeners("mute-state-changed"),
});
