const { app, globalShortcut } = require('electron');
const { controlPlayback } = require('./playbackControl');

app.on('ready', () => {
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    controlPlayback('play');
  });

  globalShortcut.register('CommandOrControl+Shift+O', () => {
    controlPlayback('pause');
  });

  globalShortcut.register('CommandOrControl+Shift+N', () => {
    controlPlayback('next');
  });

  globalShortcut.register('CommandOrControl+Shift+B', () => {
    controlPlayback('previous');
  });

  console.log('Global shortcuts registered.');
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});