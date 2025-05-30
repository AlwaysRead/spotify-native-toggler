# Spotify Native Toggler

<div align="center">

![Spotify Native Toggler](https://img.shields.io/badge/status-in_development-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green)

**Control your Spotify playback without switching windows**

</div>

## Overview

Spotify Native Toggler is a lightweight desktop application that provides global control over your Spotify playback from anywhere on your system. No more Alt+Tab interruptions during your workflow!

### Why This Exists

Windows 11 lacks a universal media controller, making it frustrating to manage music while deep in other tasks. Whether you're gaming intensely, in a coding flow state, or working across multiple applications, this tool ensures your music is always just a keyboard shortcut away.

## Features

- **Global Playback Control**: Play, pause, and skip tracks from any application
- **Real-time Display**: View current song title, artist, and album artwork
- **Global Keyboard Shortcuts**: Control music without opening the app window
- **Secure Authentication**: OAuth 2.0 integration with Spotify (Authorization Code Flow)
- **Minimal Resource Usage**: Lightweight design to avoid system slowdown

## Screenshots

<div align="center">
<!-- Placeholder for screenshots -->
<i>Coming soon! The application UI is currently under development.</i>
</div>

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [Spotify Developer Account](https://developer.spotify.com/dashboard/applications)
- [Electron](https://www.electronjs.org/) (installed via npm)
- **Spotify Premium** account (required by Spotify API for playback control)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AlwaysRead/spotify-native-toggler.git
   cd spotify-native-toggler
   ```

2. **Install dependencies**
   ```bash
   npm install express open
   ```

3. **Set up your Spotify Developer Account**
   - Navigate to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications)
   - Create a new application
   - Add `http://127.0.0.1:3000/callback` as a Redirect URI
   - Note your **Client ID** and **Client Secret**

4. **Configure environment variables**
   - Create a `.env` file in the project root:
   ```
   SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/callback
   ```

   > **Warning:** Never commit your `.env` file to version control or share your client secret publicly.

## Usage

1. **Start the application**
   ```bash
   npm start
   ```
   > On first run, the app will open a browser window for Spotify authentication.

2. **Global Shortcuts**
   - `Ctrl+Shift+P` — Play
   - `Ctrl+Shift+O` — Pause
   - `Ctrl+Shift+N` — Next Track
   - `Ctrl+Shift+B` — Previous Track

3. **App Interface**
   - View current song information and album artwork
   - Use on-screen controls for playback

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) for making this integration possible
- [Electron](https://www.electronjs.org/) for the cross-platform desktop framework

---

<div align="center">
<p>Built by <a href="https://github.com/AlwaysRead">AlwaysRead</a></p>
</div>