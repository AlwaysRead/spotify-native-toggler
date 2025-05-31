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

function resetHideTimeout() {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }
  
  // Only start the hide timeout if we're not hovering over controls
  if (!isHovering) {
    hideTimeout = setTimeout(() => {
      const container = document.querySelector('.container');
      if (container) {
        container.classList.add('hiding');
        setTimeout(() => {
          if (!isHovering) {  // Double check we're still not hovering
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
    document.getElementById("album-cover").src = song.albumCover;
    document.getElementById("song-title").innerText = song.title;
    document.getElementById("song-artist").innerText = song.artist;
    isPlaying = song.isPlaying;
    updatePlayPauseButton();
  }
}

function updatePlayPauseButton() {
  const btn = document.getElementById("play-pause-btn");
  if (!btn) return;
  
  const svg = btn.querySelector('svg');
  if (isPlaying) {
    svg.innerHTML = `
      <path d="M6 4H10V20H6V4Z"/>
      <path d="M14 4H18V20H14V4Z"/>
    `;
  } else {
    svg.innerHTML = `
      <path d="M5 3L19 12L5 21V3Z"/>
    `;
  }
}

function togglePlayPause() {
  if (isPlaying) {
    window.controlPlayback('pause');
    isPlaying = false;
  } else {
    window.controlPlayback('play');
    isPlaying = true;
  }
  updatePlayPauseButton();
  resetHideTimeout();
}

async function getCurrentVolume() {
  // Skip volume update if user is adjusting or if it's too soon after last update
  if (isUserAdjusting || isUpdatingVolume || (Date.now() - lastVolumeUpdate < 500)) return;
    
  try {
    const volume = await window.electronAPI.getCurrentVolume();
    if (volume !== null && volume !== 0) { // Don't update if volume is 0
      targetVolume = volume;
      currentVolume = volume;
      updateVolumeUI();
    }
  } catch (error) {
    console.error('Error fetching volume:', error);
  }
}

function updateVolumeUI() {
  const volumeSlider = document.getElementById('volume-slider');
  const volumeContainer = document.querySelector('.volume');
  
  if (volumeSlider) {
    // Only update slider if it's not being adjusted by user
    if (!isUserAdjusting) {
      volumeSlider.value = currentVolume;
    }
  }
  
  if (volumeContainer) {
    if (currentVolume === 0) {
      volumeContainer.classList.add('muted');
    } else {
      volumeContainer.classList.remove('muted');
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

// Reset the hide timeout when the window becomes visible
window.addEventListener('focus', () => {
  const container = document.querySelector('.container');
  if (container) {
    container.classList.remove('hiding');
  }
  resetHideTimeout();
});

document.addEventListener('DOMContentLoaded', () => {
  const playPauseBtn = document.getElementById('play-pause-btn');
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', togglePlayPause);
  }
  
  // Initialize volume
  getCurrentVolume();

  // Add event listeners for controls
  const controls = document.querySelector('.controls');
  const container = document.querySelector('.container');
  
  if (controls) {
    controls.addEventListener('mouseenter', () => {
      isHovering = true;
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      if (container) {
        container.classList.remove('hiding');
      }
    });
    
    controls.addEventListener('mouseleave', () => {
      isHovering = false;
      resetHideTimeout();
    });
  }

  // Add volume slider event listeners
  const volumeSlider = document.getElementById('volume-slider');
  if (volumeSlider) {
    volumeSlider.addEventListener('mousedown', () => {
      isUserAdjusting = true;
    });
    
    volumeSlider.addEventListener('mouseup', () => {
      isUserAdjusting = false;
      adjustVolume(volumeSlider.value);
    });
    
    volumeSlider.addEventListener('mouseleave', () => {
      if (isUserAdjusting) {
        isUserAdjusting = false;
        adjustVolume(volumeSlider.value);
      }
    });
  }

  // Add click event listeners to all interactive elements
  const interactiveElements = document.querySelectorAll('.button, .volume input[type="range"]');
  interactiveElements.forEach(element => {
    element.addEventListener('click', () => {
      resetHideTimeout();
      if (container) {
        container.classList.remove('hiding');
      }
    });
  });

  // Add mute toggle functionality
  const volumeLabel = document.querySelector('.volume label');
  if (volumeLabel) {
    volumeLabel.addEventListener('click', toggleMute);
  }

  // Start the hide timeout
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