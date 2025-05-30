async function updateSongDetails() {
  const song = await getCurrentSong();
  if (song) {
    document.getElementById("album-cover").src = song.albumCover;
    document.getElementById("song-title").innerText = song.title;
    document.getElementById("song-artist").innerText = song.artist;
  }
}

function adjustVolume(volume) {
  document.getElementById("volume-level").innerText = volume;
  setVolume(volume);
}

// Update song details every 5 seconds
setInterval(updateSongDetails, 5000);

window.controlPlayback = (action) => {
  window.electronAPI.controlPlayback(action);
};

// Placeholder implementations for missing functions
async function getCurrentSong() {
  return await window.electronAPI.getCurrentSong();
}
function setVolume(volume) {
  // TODO: Implement actual logic
}