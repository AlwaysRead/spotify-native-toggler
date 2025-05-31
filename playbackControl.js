const axios = require('axios');
const { getAccessToken } = require('./spotifyAuth');

async function controlPlayback(action) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    console.error('Access token is required.');
    return;
  }

  try {
    let endpoint = '';
    let method = 'put';
    
    if (action === 'play') endpoint = '/me/player/play';
    else if (action === 'pause') endpoint = '/me/player/pause';
    else if (action === 'next') {
      endpoint = '/me/player/next';
      method = 'post';
    }
    else if (action === 'previous') {
      endpoint = '/me/player/previous';
      method = 'post';
    }

    await axios({
      method: method,
      url: `https://api.spotify.com/v1${endpoint}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });
    console.log(`Spotify ${action} command executed.`);
  } catch (error) {
    console.error('Playback Control Error:', error.response?.data || error.message);
  }
}

async function getCurrentSong() {
  const accessToken = getAccessToken();
  if (!accessToken) return null;
  try {
    const res = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.data || !res.data.item) return null;
    return {
      title: res.data.item.name,
      artist: res.data.item.artists.map(a => a.name).join(', '),
      albumCover: res.data.item.album.images[0]?.url || '',
      isPlaying: res.data.is_playing
    };
  } catch (e) {
    return null;
  }
}

async function setVolume(volume) {
  const accessToken = getAccessToken();
  if (!accessToken) return null;
  
  // Ensure volume is between 0 and 100
  const validVolume = Math.max(0, Math.min(100, volume));
  
  try {
    // First, get the current device
    const deviceResponse = await axios.get('https://api.spotify.com/v1/me/player', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!deviceResponse.data.device) {
      console.error('No active device found');
      return null;
    }

    // Set the volume
    await axios.put(`https://api.spotify.com/v1/me/player/volume?volume_percent=${validVolume}`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // Verify the volume was set correctly
    const verifyResponse = await axios.get('https://api.spotify.com/v1/me/player', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const actualVolume = verifyResponse.data.device?.volume_percent;
    if (actualVolume === validVolume) {
      console.log(`Volume set to ${validVolume}%`);
      return validVolume;
    } else {
      console.error(`Volume mismatch: requested ${validVolume}%, got ${actualVolume}%`);
      return actualVolume;
    }
  } catch (error) {
    console.error('Volume Control Error:', error.response?.data || error.message);
    return null;
  }
}

async function getCurrentVolume() {
  const accessToken = getAccessToken();
  if (!accessToken) return null;
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!response.data.device) {
      console.error('No active device found');
      return 50; // Default to 50% if no device
    }
    
    const volume = response.data.device.volume_percent;
    return volume !== undefined ? volume : 50;
  } catch (error) {
    console.error('Error getting volume:', error.response?.data || error.message);
    return 50; // Default to 50% on error
  }
}

module.exports = { controlPlayback, getCurrentSong, setVolume, getCurrentVolume };