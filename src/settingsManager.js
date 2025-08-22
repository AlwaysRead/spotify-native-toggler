const fs = require("fs");
const path = require("path");
const os = require("os");

class SettingsManager {
  constructor() {
    this.settingsDir = path.join(os.homedir(), ".spotify-native-toggler");
    this.settingsFile = path.join(this.settingsDir, "settings.json");
    this.defaultSettings = {
      shortcuts: {
        toggleWindow: "CommandOrControl+Shift+Space",
        playPause: "CommandOrControl+Shift+P",
        nextTrack: "CommandOrControl+Shift+N",
        previousTrack: "CommandOrControl+Shift+B",
        volumeUp: "CommandOrControl+Shift+Up",
        volumeDown: "CommandOrControl+Shift+Down",
        mute: "CommandOrControl+Shift+M",
      },
      ui: {
        autoHide: true,
        hideDelay: 3000,
        showOnHover: true,
      },
    };

    this.ensureSettingsDirectory();
    this.loadSettings();
  }

  ensureSettingsDirectory() {
    try {
      if (!fs.existsSync(this.settingsDir)) {
        fs.mkdirSync(this.settingsDir, { recursive: true });
      }
    } catch (error) {
      console.error("Error creating settings directory:", error);
    }
  }

  loadSettings() {
    try {
      if (fs.existsSync(this.settingsFile)) {
        const settingsData = fs.readFileSync(this.settingsFile, "utf8");
        this.settings = {
          ...this.defaultSettings,
          ...JSON.parse(settingsData),
        };

        // Ensure all default shortcuts exist
        this.settings.shortcuts = {
          ...this.defaultSettings.shortcuts,
          ...this.settings.shortcuts,
        };
        this.settings.ui = { ...this.defaultSettings.ui, ...this.settings.ui };
      } else {
        this.settings = { ...this.defaultSettings };
        this.saveSettings();
      }
      console.log("Settings loaded successfully");
    } catch (error) {
      console.error("Error loading settings:", error);
      this.settings = { ...this.defaultSettings };
      this.saveSettings();
    }
  }

  saveSettings() {
    try {
      fs.writeFileSync(
        this.settingsFile,
        JSON.stringify(this.settings, null, 2)
      );
      console.log("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }

  getSettings() {
    return this.settings;
  }

  updateShortcut(action, newShortcut) {
    if (this.settings.shortcuts[action] !== undefined) {
      this.settings.shortcuts[action] = newShortcut;
      this.saveSettings();
      return true;
    }
    return false;
  }

  getShortcut(action) {
    return this.settings.shortcuts[action];
  }

  getAllShortcuts() {
    return this.settings.shortcuts;
  }

  resetToDefaults() {
    this.settings = { ...this.defaultSettings };
    this.saveSettings();
  }

  updateUISetting(key, value) {
    if (this.settings.ui[key] !== undefined) {
      this.settings.ui[key] = value;
      this.saveSettings();
      return true;
    }
    return false;
  }

  getUISetting(key) {
    return this.settings.ui[key];
  }
}

module.exports = SettingsManager;
