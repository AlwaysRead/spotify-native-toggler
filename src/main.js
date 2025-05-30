require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { controlPlayback, getCurrentSong } = require('../playbackControl');
const { authenticate } = require('../spotifyAuth');

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(async () => {
  await authenticate();
  createWindow();
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