require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { controlPlayback, getCurrentSong, setVolume, getCurrentVolume } = require('../playbackControl');
const { authenticate } = require('../spotifyAuth');
const { registerGlobalShortcuts } = require('../globalShortcuts');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 180,
    show: false,
    transparent: true,
    frame: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  
  // Hide window when it loses focus
  mainWindow.on('blur', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.hide();
    }
  });

  // Ensure window is properly shown
  mainWindow.on('show', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.setOpacity(1);
    }
  });
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
  await authenticate();
  createWindow();
  registerGlobalShortcuts(toggleWindow);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle('control-playback', async (event, action) => {
  await controlPlayback(action);
});

ipcMain.handle('get-current-song', async () => {
  return await getCurrentSong();
});

ipcMain.handle('set-volume', async (event, volume) => {
  await setVolume(volume);
});

ipcMain.handle('get-current-volume', async () => {
  return await getCurrentVolume();
});

ipcMain.handle('hide-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
});