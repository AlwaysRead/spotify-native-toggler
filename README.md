<<<<<<< HEAD
# Spotify Toggle App

## Overview
This app/plugin allows you to control Spotify playback (play, pause, next, previous) and adjust volume using global shortcuts.

## Features
- Play/Pause/Skip songs
- Volume control
- Global keyboard shortcuts

## Prerequisites
- Node.js
- Spotify Developer Account
- Electron.js

## Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/spotify-toggle-app.git
   cd spotify-toggle-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Spotify credentials (do **not** share or commit this file):
   ```plaintext
   SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/callback
   ```
   **Warning:** Never commit your `.env` file or share your client secret. Keep these credentials private.

4. Start the application:
   ```bash
   npm start
   ```

## Usage
- Use the following shortcuts to control playback:
  - `Ctrl+Shift+P` - Play
  - `Ctrl+Shift+O` - Pause
  - `Ctrl+Shift+N` - Next Track
  - `Ctrl+Shift+B` - Previous Track

## License
MIT
=======
# spotify-native-toggler
>>>>>>> fba9573a814f24c94361a73654da4d09c1226a32
