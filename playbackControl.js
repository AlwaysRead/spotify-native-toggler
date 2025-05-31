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
  if (!accessToken) return;
  try {
    await axios.put(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(`Volume set to ${volume}%`);
  } catch (error) {
    console.error('Volume Control Error:', error.response?.data || error.message);
  }
}

async function getCurrentVolume() {
  const accessToken = getAccessToken();
  if (!accessToken) return null;
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data.device.volume_percent;
  } catch (error) {
    console.error('Error getting volume:', error.response?.data || error.message);
    return null;
  }
}

module.exports = { controlPlayback, getCurrentSong, setVolume, getCurrentVolume };