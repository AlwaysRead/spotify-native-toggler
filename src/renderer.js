let isPlaying = false;
let hideTimeout = null;
let isHovering = false;
let currentVolume = 50;
let isMuted = false;
let previousVolume = 50;
let isUpdatingVolume = false;
let volumeUpdateTimeout = null;
let lastVolumeUpdate = Date.now();
let targetVolume = 50;
let isUserAdjusting = false;
let isPinned = false;
let isManualMuteToggle = false;

// Expose pin state to global window for main process access
window.isPinned = isPinned;

function resetHideTimeout() {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }

  // Only start the hide timeout if we're not hovering over controls and not pinned
  if (!isHovering && !isPinned) {
    hideTimeout = setTimeout(() => {
      const container = document.querySelector(".container");
      if (container && !isPinned) {
        container.classList.add("hiding");
        hideUIElements(); // Hide UI elements
        setTimeout(() => {
          if (!isHovering && !isPinned) {
            // Double check we're still not hovering and not pinned
            window.electronAPI.hideWindow();
          }
        }, 300);
      }
    }, 3500);
  }
}

function showUIElements() {
  const pinButton = document.getElementById("pin-button");

  if (pinButton) {
    pinButton.style.opacity = "1";
    pinButton.style.transform = "scale(1)";
    pinButton.style.pointerEvents = "auto";
  }
}

function hideUIElements() {
  if (isPinned) return; // Don't hide if pinned

  const pinButton = document.getElementById("pin-button");

  if (pinButton) {
    pinButton.style.opacity = "0";
    pinButton.style.transform = "scale(0.8)";
    pinButton.style.pointerEvents = "none";
  }
}

async function updateSongDetails() {
  const song = await getCurrentSong();
  if (song) {
    const albumCover = document.getElementById("album-cover");
    const songTitle = document.getElementById("song-title");
    const songArtist = document.getElementById("song-artist");

    // Add a subtle fade effect when updating
    if (albumCover.src !== song.albumCover) {
      albumCover.style.opacity = "0.7";
      setTimeout(() => {
        albumCover.src = song.albumCover;
        albumCover.style.opacity = "1";
      }, 150);
    }

    songTitle.innerText = song.title;
    songArtist.innerText = song.artist;
    isPlaying = song.isPlaying;
    updatePlayPauseButton();
  } else {
    // Show default state when no music is playing
    document.getElementById("song-title").innerText = "Connect to Spotify";
    document.getElementById("song-artist").innerText = "No music playing";
    isPlaying = false;
    updatePlayPauseButton();
  }
}

function updatePlayPauseButton() {
  const btn = document.getElementById("play-pause-btn");
  if (!btn) return;

  const svg = btn.querySelector("svg");
  if (isPlaying) {
    svg.innerHTML = `
      <path d="M6 4H10V20H6V4Z"/>
      <path d="M14 4H18V20H14V4Z"/>
    `;
    btn.classList.add("playing");
  } else {
    svg.innerHTML = `
      <path d="M5 3L19 12L5 21V3Z"/>
    `;
    btn.classList.remove("playing");
  }
}

async function togglePlayPause() {
  const playPauseBtn = document.getElementById("play-pause-btn");

  try {
    // Add loading state
    if (playPauseBtn) {
      playPauseBtn.style.opacity = "0.6";
      playPauseBtn.style.pointerEvents = "none";
    }

    if (isPlaying) {
      const result = await window.controlPlayback("pause");
      if (result !== false) {
        // Only update UI if the API call was successful
        isPlaying = false;
        updatePlayPauseButton();
      }
    } else {
      const result = await window.controlPlayback("play");
      if (result !== false) {
        // Only update UI if the API call was successful
        isPlaying = true;
        updatePlayPauseButton();
      }
    }
  } catch (error) {
    console.error("Error in togglePlayPause:", error);
  } finally {
    // Remove loading state
    if (playPauseBtn) {
      playPauseBtn.style.opacity = "1";
      playPauseBtn.style.pointerEvents = "auto";
    }
  }
  resetHideTimeout();
}

async function getCurrentVolume() {
  // Skip volume update if user is adjusting or if it's too soon after last update
  if (
    isUserAdjusting ||
    isUpdatingVolume ||
    Date.now() - lastVolumeUpdate < 500
  )
    return;

  try {
    const volume = await window.electronAPI.getCurrentVolume();
    if (volume !== null && volume !== 0) {
      // Don't update if volume is 0
      targetVolume = volume;
      currentVolume = volume;
      updateVolumeUI();
    }
  } catch (error) {
    console.error("Error fetching volume:", error);
  }
}

function updateVolumeUI() {
  const volumeSlider = document.getElementById("volume-slider");
  const volumeContainer = document.querySelector(".volume");

  if (volumeSlider) {
    // Only update slider if user is not adjusting AND no pending volume updates
    if (!isUserAdjusting && !isUpdatingVolume) {
      volumeSlider.value = currentVolume;
    }

    // Update dynamic color fill based on current slider value
    updateSliderFill(volumeSlider);
  }

  if (volumeContainer) {
    if (currentVolume === 0 || isMuted) {
      volumeContainer.classList.add("muted");
    } else {
      volumeContainer.classList.remove("muted");
    }
  }
}

function updateSliderFill(slider) {
  if (!slider) return;

  const value = slider.value;
  const min = slider.min || 0;
  const max = slider.max || 100;

  // Calculate percentage
  const percentage = ((value - min) / (max - min)) * 100;

  // Check if muted for different colors
  const volumeContainer = document.querySelector(".volume");
  const isMutedState =
    volumeContainer && volumeContainer.classList.contains("muted");

  let gradient;
  if (isMutedState || value == 0) {
    // Muted state: gray fill up to knob position
    gradient = `linear-gradient(90deg,
      rgba(255, 255, 255, 0.4) 0%,
      rgba(255, 255, 255, 0.4) ${percentage}%,
      rgba(255, 255, 255, 0.15) ${percentage}%,
      rgba(255, 255, 255, 0.15) 100%)`;
  } else {
    // Normal state: green fill up to knob position
    gradient = `linear-gradient(90deg,
      #1db954 0%,
      #3bd17f ${percentage}%,
      rgba(255, 255, 255, 0.2) ${percentage}%,
      rgba(255, 255, 255, 0.2) 100%)`;
  }

  slider.style.background = gradient;
}

async function adjustVolume(volume) {
  const newVolume = parseInt(volume);
  if (isNaN(newVolume) || newVolume < 0 || newVolume > 100) return;

  // Don't allow setting volume to 0 unless explicitly muted
  if (newVolume === 0 && !isMuted) return;

  // Clear any pending volume updates
  if (volumeUpdateTimeout) {
    clearTimeout(volumeUpdateTimeout);
  }

  // Store the target volume
  targetVolume = newVolume;

  // Debounce the actual volume update
  volumeUpdateTimeout = setTimeout(async () => {
    isUpdatingVolume = true;
    const volumeContainer = document.querySelector(".volume");
    const volumeLabel = document.getElementById("volume-label");

    try {
      // Add subtle loading state to label only, not the entire container
      if (volumeLabel) {
        volumeLabel.style.opacity = "0.6";
      }

      const result = await window.electronAPI.setVolume(newVolume);
      if (result !== null) {
        // Update the actual volume after successful API response
        currentVolume = result;
        targetVolume = result;

        // Don't auto-update mute state if this is part of a manual mute toggle
        if (!isManualMuteToggle) {
          if (currentVolume > 0) {
            previousVolume = currentVolume;
            isMuted = false;
          } else {
            isMuted = true;
          }
        }

        // Only update mute state visual, slider position will be preserved
        const volumeContainer = document.querySelector(".volume");
        if (volumeContainer) {
          if (currentVolume === 0 || isMuted) {
            volumeContainer.classList.add("muted");
          } else {
            volumeContainer.classList.remove("muted");
          }
        }

        lastVolumeUpdate = Date.now();
      }
    } catch (error) {
      console.error("Error setting volume:", error);
      // Revert slider to previous volume on error only if user is not adjusting
      const volumeSlider = document.getElementById("volume-slider");
      if (volumeSlider && !isUserAdjusting) {
        volumeSlider.value = currentVolume;
      }
      targetVolume = currentVolume;
    } finally {
      isUpdatingVolume = false;

      // Remove loading state from label only
      if (volumeLabel) {
        volumeLabel.style.opacity = "1";
      }
    }
  }, 100); // Wait 100ms before actually setting the volume  resetHideTimeout();
}

async function toggleMute() {
  console.log("toggleMute called - current state:", {
    isMuted,
    currentVolume,
    previousVolume,
  });

  const volumeLabel = document.getElementById("volume-label");

  try {
    isManualMuteToggle = true; // Set flag to prevent automatic mute state changes

    // Add loading state
    if (volumeLabel) {
      volumeLabel.style.opacity = "0.6";
      volumeLabel.style.pointerEvents = "none";
    }

    if (isMuted) {
      // Unmute
      console.log("Unmuting - restoring volume to:", previousVolume);
      const result = await window.electronAPI.setVolume(previousVolume);
      if (result !== null) {
        currentVolume = result;
        targetVolume = result;
        isMuted = false;
        updateVolumeUI();
      }
    } else {
      // Mute
      console.log("Muting - saving current volume:", currentVolume);
      if (currentVolume > 0) {
        previousVolume = currentVolume;
      }
      const result = await window.electronAPI.setVolume(0);
      if (result !== null) {
        currentVolume = 0;
        targetVolume = 0;
        isMuted = true;
        updateVolumeUI();
      }
    }

    console.log("After toggle - new state:", {
      isMuted,
      currentVolume,
      previousVolume,
    });
  } catch (error) {
    console.error("Error in toggleMute:", error);
  } finally {
    isManualMuteToggle = false; // Reset flag

    // Remove loading state
    if (volumeLabel) {
      volumeLabel.style.opacity = "1";
      volumeLabel.style.pointerEvents = "auto";
    }
  }

  resetHideTimeout();
}

function togglePin() {
  isPinned = !isPinned;
  window.isPinned = isPinned; // Update global window property
  const pinButton = document.getElementById("pin-button");
  const container = document.querySelector(".container");

  if (pinButton) {
    if (isPinned) {
      pinButton.classList.add("pinned");
      pinButton.title = "Unpin Player";
    } else {
      pinButton.classList.remove("pinned");
      pinButton.title = "Pin Player";
    }
  }

  if (isPinned) {
    // Clear any existing hide timeout
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    // Show the container if it's hiding
    if (container) {
      container.classList.remove("hiding");
    }
  } else {
    // If unpinned, start the normal hide behavior
    resetHideTimeout();
  }
}

// Reset the hide timeout when the window becomes visible
window.addEventListener("focus", () => {
  const container = document.querySelector(".container");
  if (container) {
    container.classList.remove("hiding");
  }
  resetHideTimeout();
});

document.addEventListener("DOMContentLoaded", () => {
  const playPauseBtn = document.getElementById("play-pause-btn");
  if (playPauseBtn) {
    playPauseBtn.addEventListener("click", togglePlayPause);
  }

  // Initialize volume
  getCurrentVolume();

  // Initialize volume slider visibility and value
  let volumeSlider = document.getElementById("volume-slider");
  if (volumeSlider) {
    volumeSlider.value = currentVolume;
    volumeSlider.style.opacity = "1";
    volumeSlider.style.visibility = "visible";
    // Initialize the dynamic color fill
    updateSliderFill(volumeSlider);
  }

  // Add event listeners for controls
  const controls = document.querySelector(".controls");
  const container = document.querySelector(".container");

  if (controls) {
    controls.addEventListener("mouseenter", () => {
      isHovering = true;
      showUIElements();
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      if (container) {
        container.classList.remove("hiding");
      }
    });

    controls.addEventListener("mouseleave", () => {
      isHovering = false;
      resetHideTimeout();
    });
  }

  // Show UI elements when hovering
  if (container) {
    container.addEventListener("mouseenter", () => {
      isHovering = true;
      showUIElements();
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      container.classList.remove("hiding");
    });

    container.addEventListener("mouseleave", () => {
      isHovering = false;
      resetHideTimeout();
    });
  }

  // Add volume slider event listeners with enhanced feedback
  volumeSlider = document.getElementById("volume-slider");
  const volumeContainer = document.querySelector(".volume");

  if (volumeSlider && volumeContainer) {
    volumeSlider.addEventListener("mousedown", () => {
      isUserAdjusting = true;
      volumeContainer.style.transform = "scale(1.02)";
    });

    volumeSlider.addEventListener("mouseup", () => {
      isUserAdjusting = false;
      volumeContainer.style.transform = "scale(1)";
      adjustVolume(volumeSlider.value);
    });

    volumeSlider.addEventListener("mouseleave", () => {
      if (isUserAdjusting) {
        isUserAdjusting = false;
        volumeContainer.style.transform = "scale(1)";
        adjustVolume(volumeSlider.value);
      }
    });

    // Add real-time input event for smooth dragging experience
    volumeSlider.addEventListener("input", () => {
      // Update color fill in real-time as user drags
      updateSliderFill(volumeSlider);

      if (isUserAdjusting) {
        // Update visual mute state immediately while dragging
        const volume = parseInt(volumeSlider.value);
        if (volume === 0) {
          volumeContainer.classList.add("muted");
        } else {
          volumeContainer.classList.remove("muted");
        }
      }
    });

    // Add hover effect
    volumeContainer.addEventListener("mouseenter", () => {
      isHovering = true;
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      if (container) {
        container.classList.remove("hiding");
      }
    });

    volumeContainer.addEventListener("mouseleave", () => {
      isHovering = false;
      resetHideTimeout();
    });
  }

  // Add click event listeners to all interactive elements with enhanced feedback
  const buttons = document.querySelectorAll(".button");
  buttons.forEach((button) => {
    button.addEventListener("click", (e) => {
      // Add ripple effect
      const ripple = document.createElement("span");
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(29, 185, 84, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
        z-index: 0;
      `;

      button.style.position = "relative";
      button.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);

      resetHideTimeout();
      if (container) {
        container.classList.remove("hiding");
      }
    });
  });

  // Add mute toggle functionality
  const volumeLabel = document.querySelector(".volume label");
  console.log("Volume label found:", volumeLabel);
  if (volumeLabel) {
    volumeLabel.addEventListener("click", (e) => {
      console.log("Volume icon clicked - toggling mute");
      e.preventDefault();
      e.stopPropagation();
      toggleMute();
    });

    // Make sure the label is clearly clickable
    volumeLabel.style.cursor = "pointer";
    volumeLabel.title = "Click to mute/unmute";
  } else {
    console.error("Volume label not found!");
  }

  // Add pin button functionality
  const pinButton = document.getElementById("pin-button");
  console.log("Pin button found:", pinButton);
  if (pinButton) {
    pinButton.addEventListener("click", togglePin);

    // Prevent auto-hide when hovering over pin button
    pinButton.addEventListener("mouseenter", () => {
      isHovering = true;
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      if (container) {
        container.classList.remove("hiding");
      }
    });

    pinButton.addEventListener("mouseleave", () => {
      isHovering = false;
      resetHideTimeout();
    });
  } else {
    console.error("Pin button not found!");
  }

  // Start the hide timeout
  resetHideTimeout();
});

// Listen for mute state changes from global shortcuts
console.log("Renderer.js loaded - Setting up mute state change listener");
window.electronAPI.onMuteStateChanged((event, data) => {
  console.log("Renderer: Received mute state change:", data);
  const { volume, isMuted } = data;

  // Update the local mute state and UI
  currentVolume = isMuted ? 0 : volume;
  updateMuteButton();

  // Update volume slider to reflect mute state
  const volumeSlider = document.getElementById("volume-slider");
  if (volumeSlider) {
    console.log("Updating volume slider:", {
      isMuted,
      volume,
      newValue: isMuted ? 0 : volume,
    });
    volumeSlider.value = isMuted ? 0 : volume;
    updateSliderFill(volumeSlider);
  }
});

// Update song details and volume every second, but avoid interfering with user interactions
setInterval(async () => {
  await updateSongDetails();
  // Only fetch volume if user is not currently interacting with controls
  if (!isUserAdjusting && !isUpdatingVolume) {
    await getCurrentVolume();
  }
}, 1000);

window.controlPlayback = async (action) => {
  try {
    const result = await window.electronAPI.controlPlayback(action);
    resetHideTimeout();
    return result;
  } catch (error) {
    console.error(
      `Playback control error for action '${action}':`,
      error.message
    );

    // Show user-friendly notification
    if (error.message.includes("Premium")) {
      showNotification("Spotify Premium Required", "error");
    } else if (error.message.includes("device")) {
      showNotification(
        "No Spotify device found. Open Spotify first.",
        "warning"
      );
    } else if (error.message.includes("Restriction violated")) {
      showNotification(
        "Spotify playback restricted. Try starting music first.",
        "warning"
      );
    } else {
      showNotification("Spotify operation failed", "error");
    }

    return false;
  }
};

// Simple notification system
function showNotification(message, type = "info") {
  // Remove any existing notification
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Style the notification
  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    background:
      type === "error"
        ? "rgba(220, 38, 38, 0.9)"
        : type === "warning"
        ? "rgba(245, 158, 11, 0.9)"
        : "rgba(59, 130, 246, 0.9)",
    color: "white",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    zIndex: "10000",
    maxWidth: "300px",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    animation: "slideInFromRight 0.3s ease-out",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
  });

  // Add animation styles if not already present
  if (!document.querySelector("#notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
      @keyframes slideInFromRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOutToRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Add to document
  document.body.appendChild(notification);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = "slideOutToRight 0.3s ease-in";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }, 4000);
}

// Placeholder implementations for missing functions
async function getCurrentSong() {
  return await window.electronAPI.getCurrentSong();
}
