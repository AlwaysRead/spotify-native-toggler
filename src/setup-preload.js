const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  saveCredentials: (credentials) =>
    ipcRenderer.invoke("save-credentials", credentials),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  setupComplete: () => ipcRenderer.invoke("setup-complete"),
});
