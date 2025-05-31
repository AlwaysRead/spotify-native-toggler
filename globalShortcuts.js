const { globalShortcut } = require('electron');
const { controlPlayback } = require('./playbackControl');

function registerGlobalShortcuts(toggleWindow) {
  // Show/Hide window
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    toggleWindow();
  });

  // Play/Pause toggle
  globalShortcut.register('MediaPlayPause', () => {
    controlPlayback('play');
  });

  // Next track
  globalShortcut.register('MediaNextTrack', () => {
    controlPlayback('next');
  });

  // Previous track
  globalShortcut.register('MediaPreviousTrack', () => {
    controlPlayback('previous');
  });

  // Custom shortcuts (as fallback)
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    controlPlayback('play');
  });

  globalShortcut.register('CommandOrControl+Shift+N', () => {
    controlPlayback('next');
  });

  globalShortcut.register('CommandOrControl+Shift+B', () => {
    controlPlayback('previous');
  });

  console.log('Global shortcuts registered.');
}

module.exports = { registerGlobalShortcuts };