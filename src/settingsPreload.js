const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),
  resetSettings: () => ipcRenderer.invoke("reset-settings"),
  closeSettings: () => ipcRenderer.invoke("close-settings"),
});
