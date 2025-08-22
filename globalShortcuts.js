const { globalShortcut } = require("electron");
const { controlPlayback } = require("./playbackControl");

function registerGlobalShortcuts(
  toggleWindow,
  settingsManager = null,
  mainWindow = null
) {
  // Unregister all existing shortcuts first
  globalShortcut.unregisterAll();

  // Get shortcuts from settings or use defaults
  let shortcuts;
  if (settingsManager) {
    shortcuts = settingsManager.getAllShortcuts();
  } else {
    // Default shortcuts if no settings manager
    shortcuts = {
      toggleWindow: "CommandOrControl+Shift+Space",
      playPause: "CommandOrControl+Shift+P",
      nextTrack: "CommandOrControl+Shift+N",
      previousTrack: "CommandOrControl+Shift+B",
      volumeUp: "CommandOrControl+Shift+Up",
      volumeDown: "CommandOrControl+Shift+Down",
      mute: "CommandOrControl+Shift+M",
    };
  }

  try {
    // Show/Hide window
    if (shortcuts.toggleWindow) {
      globalShortcut.register(shortcuts.toggleWindow, () => {
        toggleWindow();
      });
    }

    // Play/Pause toggle
    if (shortcuts.playPause) {
      globalShortcut.register(shortcuts.playPause, async () => {
        try {
          console.log("Global shortcut: play/pause triggered");
          const { getCurrentPlaybackState } = require("./playbackControl");
          const playbackState = await getCurrentPlaybackState();
          console.log("Playback state:", {
            hasState: !!playbackState,
            isPlaying: playbackState?.is_playing,
            device: playbackState?.device?.name,
          });

          // Check if music is currently playing based on full playback state
          const isPlaying = playbackState && playbackState.is_playing;
          const action = isPlaying ? "pause" : "play";
          console.log("Executing action:", action);

          await controlPlayback(action);
        } catch (error) {
          console.error("Global shortcut playPause error:", error.message);
        }
      });
    }

    // Next track
    if (shortcuts.nextTrack) {
      globalShortcut.register(shortcuts.nextTrack, async () => {
        try {
          await controlPlayback("next");
        } catch (error) {
          console.error("Global shortcut nextTrack error:", error.message);
        }
      });
    }

    // Previous track
    if (shortcuts.previousTrack) {
      globalShortcut.register(shortcuts.previousTrack, async () => {
        try {
          await controlPlayback("previous");
        } catch (error) {
          console.error("Global shortcut previousTrack error:", error.message);
        }
      });
    }

    // Volume controls (if Spotify API supports it)
    if (shortcuts.volumeUp) {
      globalShortcut.register(shortcuts.volumeUp, async () => {
        try {
          const { getCurrentVolume, setVolume } = require("./playbackControl");
          const currentVolume = await getCurrentVolume();
          if (currentVolume !== null) {
            const newVolume = Math.min(100, currentVolume + 10);
            await setVolume(newVolume);
          }
        } catch (error) {
          console.error("Error adjusting volume up:", error);
        }
      });
    }

    if (shortcuts.volumeDown) {
      globalShortcut.register(shortcuts.volumeDown, async () => {
        try {
          const { getCurrentVolume, setVolume } = require("./playbackControl");
          const currentVolume = await getCurrentVolume();
          if (currentVolume !== null) {
            const newVolume = Math.max(0, currentVolume - 10);
            await setVolume(newVolume);
          }
        } catch (error) {
          console.error("Error adjusting volume down:", error);
        }
      });
    }

    if (shortcuts.mute) {
      let previousVolume = 50;
      globalShortcut.register(shortcuts.mute, async () => {
        try {
          const { getCurrentVolume, setVolume } = require("./playbackControl");
          const currentVolume = await getCurrentVolume();
          if (currentVolume !== null) {
            let newVolume;
            let isMuted = false;

            if (currentVolume > 0) {
              // Currently playing, so mute it
              previousVolume = currentVolume;
              newVolume = 0;
              isMuted = true;
            } else {
              // Currently muted, so unmute it
              newVolume = previousVolume;
              isMuted = false;
            }

            await setVolume(newVolume);

            // Notify the main window about the mute state change
            if (mainWindow && !mainWindow.isDestroyed()) {
              const eventData = {
                volume: isMuted ? previousVolume : newVolume,
                isMuted: isMuted,
              };
              console.log("Sending mute state change event:", eventData);
              console.log("Main window status:", {
                exists: !!mainWindow,
                isDestroyed: mainWindow ? mainWindow.isDestroyed() : "N/A",
                webContentsId: mainWindow ? mainWindow.webContents.id : "N/A",
              });
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send("mute-state-changed", eventData);
                console.log("Event sent to main window");
              } else {
                console.log("Main window not available for IPC");
              }
            }
          }
        } catch (error) {
          console.error("Error toggling mute:", error);
        }
      });
    }

    // Also register media keys as fallback
    try {
      globalShortcut.register("MediaPlayPause", () => {
        controlPlayback("play");
      });

      globalShortcut.register("MediaNextTrack", () => {
        controlPlayback("next");
      });

      globalShortcut.register("MediaPreviousTrack", () => {
        controlPlayback("previous");
      });
    } catch (error) {
      console.log("Media keys not available on this system");
    }

    console.log("Global shortcuts registered with settings:", shortcuts);
  } catch (error) {
    console.error("Error registering global shortcuts:", error);
  }
}

module.exports = { registerGlobalShortcuts };
