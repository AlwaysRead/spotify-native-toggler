const { contextBridge, ipcRenderer } = require("electron");

// Expose authentication APIs to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Authenticate with Spotify
  authenticate: () => ipcRenderer.invoke("authenticate-spotify"),

  // Close the auth window
  closeAuthWindow: () => ipcRenderer.invoke("close-auth-window"),

  // Listen for authentication success
  onAuthSuccess: (callback) => ipcRenderer.on("auth-success", callback),

  // Listen for authentication updates
  onAuthUpdate: (callback) => ipcRenderer.on("auth-update", callback),

  // Remove authentication listeners
  removeAuthListeners: () => {
    ipcRenderer.removeAllListeners("auth-update");
    ipcRenderer.removeAllListeners("auth-success");
  },
});
