const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const { hasCredentials, saveCredentials } = require("./credentialsManager");

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
let setupWindow = null;

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

function createSetupWindow() {
  setupWindow = new BrowserWindow({
    width: 650,
    height: 800,
    minWidth: 650,
    minHeight: 800,
    resizable: false,
    show: true,
    center: true,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "setup-preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  setupWindow.loadFile(path.join(__dirname, "setup.html"));

  setupWindow.on("closed", () => {
    setupWindow = null;
  });

  return setupWindow;
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
  // Check if user has set up their Spotify app credentials
  if (!hasCredentials()) {
    // Show setup window first
    createSetupWindow();
  } else {
    // Show auth window if credentials exist
    createAuthWindow();
  }
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

// Setup window handlers
ipcMain.handle("save-credentials", async (event, credentials) => {
  try {
    const success = saveCredentials(
      credentials.clientId,
      credentials.clientSecret
    );
    if (success) {
      return { success: true };
    } else {
      return { success: false, error: "Failed to save credentials" };
    }
  } catch (error) {
    console.error("Error saving credentials:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("open-external", async (event, url) => {
  await shell.openExternal(url);
});

ipcMain.handle("setup-complete", () => {
  if (setupWindow && !setupWindow.isDestroyed()) {
    setupWindow.close();
    // Show auth window after setup is complete
    createAuthWindow();
  }
});
