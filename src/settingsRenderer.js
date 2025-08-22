let currentRecording = null;
let recordingTimeout = null;

// Load settings when page loads
document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
});

async function loadSettings() {
  try {
    const settings = await window.electronAPI.getSettings();
    console.log("Loaded settings:", settings);

    // Populate shortcut inputs
    const shortcuts = settings.shortcuts || {};
    Object.keys(shortcuts).forEach((key) => {
      const input = document.getElementById(key);
      if (input) {
        input.value = shortcuts[key] || "";
      }
    });
  } catch (error) {
    console.error("Error loading settings:", error);
    showStatus("Error loading settings", "error");
  }
}

function recordShortcut(actionKey) {
  // Stop any current recording
  if (currentRecording) {
    stopRecording();
  }

  const input = document.getElementById(actionKey);
  const button = input.parentElement.querySelector(".record-btn");

  if (!input || !button) return;

  // Start recording
  currentRecording = actionKey;
  input.classList.add("recording");
  button.classList.add("recording");
  button.textContent = "Recording...";
  input.value = "Press keys...";
  input.focus();

  // Set timeout to stop recording after 10 seconds
  recordingTimeout = setTimeout(() => {
    stopRecording();
    showStatus("Recording timeout - please try again", "error");
  }, 10000);

  // Add keyboard event listener
  document.addEventListener("keydown", handleKeyRecording);
}

function handleKeyRecording(event) {
  if (!currentRecording) return;

  event.preventDefault();
  event.stopPropagation();

  // Build shortcut string
  const parts = [];

  // Add modifiers
  if (event.ctrlKey || event.metaKey) {
    parts.push("CommandOrControl");
  }
  if (event.shiftKey) {
    parts.push("Shift");
  }
  if (event.altKey) {
    parts.push("Alt");
  }

  // Add main key (if it's not a modifier)
  if (!["Control", "Shift", "Alt", "Meta", "Cmd"].includes(event.key)) {
    let key = event.key;

    // Handle special keys
    switch (event.key) {
      case " ":
        key = "Space";
        break;
      case "ArrowUp":
        key = "Up";
        break;
      case "ArrowDown":
        key = "Down";
        break;
      case "ArrowLeft":
        key = "Left";
        break;
      case "ArrowRight":
        key = "Right";
        break;
      case "Escape":
        key = "Escape";
        break;
      case "Enter":
        key = "Return";
        break;
      case "Backspace":
        key = "Backspace";
        break;
      case "Delete":
        key = "Delete";
        break;
      case "Tab":
        key = "Tab";
        break;
      default:
        // For letters, use uppercase
        if (key.length === 1 && key.match(/[a-z]/i)) {
          key = key.toUpperCase();
        }
        break;
    }

    parts.push(key);
  }

  // Only save if we have at least one modifier and one main key
  if (parts.length >= 2) {
    const shortcut = parts.join("+");
    const input = document.getElementById(currentRecording);
    if (input) {
      input.value = shortcut;
    }

    stopRecording();
    showStatus(`Shortcut recorded: ${shortcut}`, "success");
  }
}

function stopRecording() {
  if (!currentRecording) return;

  const input = document.getElementById(currentRecording);
  const button = input.parentElement.querySelector(".record-btn");

  // Clear recording state
  input.classList.remove("recording");
  button.classList.remove("recording");
  button.textContent = "Record";

  // Remove event listener
  document.removeEventListener("keydown", handleKeyRecording);

  // Clear timeout
  if (recordingTimeout) {
    clearTimeout(recordingTimeout);
    recordingTimeout = null;
  }

  currentRecording = null;
}

async function saveSettings() {
  try {
    // Collect all shortcuts
    const shortcuts = {};
    const shortcutKeys = [
      "toggleWindow",
      "playPause",
      "nextTrack",
      "previousTrack",
      "volumeUp",
      "volumeDown",
      "mute",
    ];

    shortcutKeys.forEach((key) => {
      const input = document.getElementById(key);
      if (input && input.value.trim()) {
        shortcuts[key] = input.value.trim();
      }
    });

    // Validate shortcuts (check for duplicates)
    const values = Object.values(shortcuts);
    const duplicates = values.filter(
      (value, index) => values.indexOf(value) !== index
    );

    if (duplicates.length > 0) {
      showStatus(
        "Error: Duplicate shortcuts detected. Each shortcut must be unique.",
        "error"
      );
      return;
    }

    // Save settings
    const success = await window.electronAPI.saveSettings({ shortcuts });

    if (success) {
      showStatus("Settings saved successfully! 🎉", "success");
    } else {
      showStatus("Error saving settings", "error");
    }
  } catch (error) {
    console.error("Error saving settings:", error);
    showStatus("Error saving settings", "error");
  }
}

async function resetToDefaults() {
  if (
    confirm(
      "Are you sure you want to reset all shortcuts to their default values?"
    )
  ) {
    try {
      const success = await window.electronAPI.resetSettings();
      if (success) {
        await loadSettings();
        showStatus("Settings reset to defaults! 🔄", "success");
      } else {
        showStatus("Error resetting settings", "error");
      }
    } catch (error) {
      console.error("Error resetting settings:", error);
      showStatus("Error resetting settings", "error");
    }
  }
}

function closeSettings() {
  window.electronAPI.closeSettings();
}

function showStatus(message, type) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = `status ${type}`;

  // Hide after 3 seconds
  setTimeout(() => {
    status.style.opacity = "0";
  }, 3000);
}

// Handle window close
window.addEventListener("beforeunload", () => {
  if (currentRecording) {
    stopRecording();
  }
});
