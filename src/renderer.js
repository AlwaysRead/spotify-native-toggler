let isPlaying = false;

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
  btn.innerText = isPlaying ? "⏸️" : "▶️";
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
}

document.addEventListener('DOMContentLoaded', () => {
  const playPauseBtn = document.getElementById('play-pause-btn');
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', togglePlayPause);
  }
});

function adjustVolume(volume) {
  document.getElementById("volume-level").innerText = volume;
  window.electronAPI.setVolume(parseInt(volume));
}

// Update song details every second
setInterval(updateSongDetails, 1000);

window.controlPlayback = (action) => {
  window.electronAPI.controlPlayback(action);
};

// Placeholder implementations for missing functions
async function getCurrentSong() {
  return await window.electronAPI.getCurrentSong();
}