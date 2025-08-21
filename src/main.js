require("dotenv").config();
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

// Suppress cache warnings
app.commandLine.appendSwitch("--disable-gpu-sandbox");
app.commandLine.appendSwitch("--disable-software-rasterizer");

const {
  controlPlayback,
  getCurrentSong,
  setVolume,
  getCurrentVolume,
} = require("../playbackControl");
const { authenticate } = require("../spotifyAuth");
const { registerGlobalShortcuts } = require("../globalShortcuts");

let mainWindow = null;
let authWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 200,
    minWidth: 500,
    maxWidth: 500,
    minHeight: 200,
    maxHeight: 200,
    resizable: false,
    show: false,
    transparent: true,
    frame: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Hide window when it loses focus (only if not pinned)
  mainWindow.on("blur", async () => {
    if (!mainWindow.isDestroyed()) {
      try {
        const isPinned = await mainWindow.webContents.executeJavaScript(
          "window.isPinned || false"
        );
        if (!isPinned) {
          mainWindow.hide();
        }
      } catch (error) {
        // If there's an error getting pin state, hide anyway (default behavior)
        mainWindow.hide();
      }
    }
  });

  // Ensure window is properly shown
  mainWindow.on("show", () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.setOpacity(1);
    }
  });
}

function createAuthWindow() {
  authWindow = new BrowserWindow({
    width: 500,
    height: 600,
    minWidth: 500,
    minHeight: 600,
    resizable: false,
    show: true,
    center: true,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "auth-preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  authWindow.loadFile(path.join(__dirname, "auth.html"));

  authWindow.on("closed", () => {
    authWindow = null;
  });

  return authWindow;
}

function toggleWindow() {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.setOpacity(1);
    mainWindow.show();
    mainWindow.focus();
  }
}

app.whenReady().then(async () => {
  // Always show auth window first - let user choose to connect
  createAuthWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("control-playback", async (event, action) => {
  await controlPlayback(action);
});

ipcMain.handle("get-current-song", async () => {
  return await getCurrentSong();
});

ipcMain.handle("set-volume", async (event, volume) => {
  return await setVolume(volume);
});

ipcMain.handle("get-current-volume", async () => {
  return await getCurrentVolume();
});

ipcMain.handle("hide-window", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
});

// Authentication window handlers
ipcMain.handle("authenticate-spotify", async () => {
  try {
    console.log("Starting authentication...");
    await authenticate();
    console.log("Authentication successful!");

    // Give a small delay to ensure everything is ready
    setTimeout(() => {
      if (authWindow && !authWindow.isDestroyed()) {
        authWindow.webContents.send("auth-success");
      }
    }, 500);

    return { success: true };
  } catch (error) {
    console.error("Authentication error:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("close-auth-window", () => {
  if (authWindow && !authWindow.isDestroyed()) {
    authWindow.close();
    // Create main window after successful authentication
    createWindow();
    registerGlobalShortcuts(toggleWindow);
  }
});
