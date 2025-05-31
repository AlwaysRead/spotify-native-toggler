let isPlaying = false;
let hideTimeout = null;
let isHovering = false;
let previousVolume = 50;
let isMuted = false;

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
  try {
    const response = await window.electronAPI.getCurrentVolume();
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider && response !== null) {
      volumeSlider.value = response;
      previousVolume = response;
      updateMuteState(response === 0);
    }
  } catch (error) {
    console.error('Error fetching volume:', error);
  }
}

function updateMuteState(muted) {
  isMuted = muted;
  const volumeContainer = document.querySelector('.volume');
  if (volumeContainer) {
    if (muted) {
      volumeContainer.classList.add('muted');
    } else {
      volumeContainer.classList.remove('muted');
    }
  }
}

function adjustVolume(volume) {
  const newVolume = parseInt(volume);
  window.electronAPI.setVolume(newVolume);
  
  if (newVolume > 0) {
    previousVolume = newVolume;
    updateMuteState(false);
  } else {
    updateMuteState(true);
  }
  
  resetHideTimeout();
}

function toggleMute() {
  const volumeSlider = document.getElementById('volume-slider');
  const volumeContainer = document.querySelector('.volume');
  
  if (isMuted) {
    // Unmute
    volumeSlider.value = previousVolume;
    window.electronAPI.setVolume(previousVolume);
    updateMuteState(false);
  } else {
    // Mute
    previousVolume = parseInt(volumeSlider.value);
    volumeSlider.value = 0;
    window.electronAPI.setVolume(0);
    updateMuteState(true);
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

// Update song details every second
setInterval(updateSongDetails, 1000);

window.controlPlayback = (action) => {
  window.electronAPI.controlPlayback(action);
  resetHideTimeout();
};

// Placeholder implementations for missing functions
async function getCurrentSong() {
  return await window.electronAPI.getCurrentSong();
}