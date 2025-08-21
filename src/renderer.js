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

function togglePlayPause() {
  if (isPlaying) {
    window.controlPlayback("pause");
    isPlaying = false;
  } else {
    window.controlPlayback("play");
    isPlaying = true;
  }
  updatePlayPauseButton();
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
    // Only update slider if it's not being adjusted by user
    if (!isUserAdjusting) {
      volumeSlider.value = currentVolume;
    }
  }

  if (volumeContainer) {
    if (currentVolume === 0) {
      volumeContainer.classList.add("muted");
    } else {
      volumeContainer.classList.remove("muted");
    }
  }
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

  // Update UI immediately for responsiveness
  targetVolume = newVolume;
  currentVolume = newVolume;
  updateVolumeUI();

  // Debounce the actual volume update
  volumeUpdateTimeout = setTimeout(async () => {
    isUpdatingVolume = true;
    try {
      const result = await window.electronAPI.setVolume(newVolume);
      if (result !== null) {
        currentVolume = result;
        targetVolume = result;
        if (currentVolume > 0) {
          previousVolume = currentVolume;
          isMuted = false;
        } else {
          isMuted = true;
        }
        updateVolumeUI();
        lastVolumeUpdate = Date.now();
      }
    } finally {
      isUpdatingVolume = false;
    }
  }, 100); // Wait 100ms before actually setting the volume

  resetHideTimeout();
}

async function toggleMute() {
  if (isMuted) {
    // Unmute
    await adjustVolume(previousVolume);
  } else {
    // Mute
    previousVolume = currentVolume;
    await adjustVolume(0);
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
  }

  // Add event listeners for controls
  const controls = document.querySelector(".controls");
  const container = document.querySelector(".container");

  if (controls) {
    controls.addEventListener("mouseenter", () => {
      isHovering = true;
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
  if (volumeLabel) {
    volumeLabel.addEventListener("click", toggleMute);
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
  } // Start the hide timeout
  resetHideTimeout();
});

// Update song details and volume every second
setInterval(async () => {
  await updateSongDetails();
  await getCurrentVolume();
}, 1000);

window.controlPlayback = (action) => {
  window.electronAPI.controlPlayback(action);
  resetHideTimeout();
};

// Placeholder implementations for missing functions
async function getCurrentSong() {
  return await window.electronAPI.getCurrentSong();
}
