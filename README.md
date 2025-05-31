<div align="center">

# Spotify Native Toggler

**Control Spotify playback seamlessly without switching windows**

</div>

## Overview

Spotify Native Toggler is a lightweight, cross-platform desktop application that enables you to control Spotify playback from any application, ensuring uninterrupted focus during work, gaming, or multitasking.

## Purpose

Windows 11 lacks a universal media controller, making it challenging to manage music playback when:

- Engaged in gaming sessions
- Focused on coding or other intensive tasks
- Working across multiple applications

This tool provides quick access to Spotify controls via global keyboard shortcuts, keeping your workflow smooth.

## Features

| Feature                     | Description                                            |
|-----------------------------|--------------------------------------------------------|
| Global Playback Control     | Play, pause, or skip tracks from any application       |
| Real-Time Display           | View current song title, artist, and album artwork     |
| Global Keyboard Shortcuts   | Manage playback without switching windows            |
| Secure Authentication       | Utilizes OAuth 2.0 Authorization Code Flow             |
| Low Resource Usage          | Runs efficiently in the background                     |

## Download

Pre-built binaries for Spotify Native Toggler are available for Windows.

**Note:** Ensure you have a Spotify Premium account to use the application, as it is required for API playback control.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher)
- [Spotify Developer Account](https://developer.spotify.com/dashboard)
- [Electron](https://www.electronjs.org/) (installed via npm for source builds)
- A Spotify Premium account (required for API playback control)

### Setup Instructions

1. **Clone the Repository** (for source builds)

   ```bash
   git clone https://github.com/AlwaysRead/spotify-native-toggler.git
   cd spotify-native-toggler
   ```

2. **Install Dependencies** (for source builds)

   ```bash
   npm install express open
   ```

3. **Set Up a Spotify Application**

   - Visit the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new application
   - Add `http://127.0.0.1:3000/callback` as a Redirect URI
   - Note your **Client ID** and **Client Secret**

4. **Configure Environment Variables** (for source builds)

   Create a `.env` file in the project root with the following:

   ```plaintext
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/callback
   ```

   **Note:** Never commit or share your `.env` file publicly.

## Usage

### Starting the Application

For pre-built binaries, launch the application by running the executable file downloaded from the releases page. For source builds, use:

```bash
npm start
```

On first launch, a browser window will prompt you to authenticate with Spotify.

### Global Keyboard Shortcuts

| Shortcut           | Action            |
|--------------------|-------------------|
| Ctrl + Shift + P   | Play              |
| Ctrl + Shift + O   | Pause             |
| Ctrl + Shift + N   | Next Track        |
| Ctrl + Shift + B   | Previous Track    |

### Application Interface

- Displays the current song, artist, and album artwork
- Provides playback controls and a volume slider

## Screenshots

<div align="center">
  <img src="snapshots/image2.png" alt="Main Interface" width="600">
  <p>Main interface with playback controls and volume slider</p>
</div>

**Note:** The user interface is under active development. Contributions from UI/UX or CSS experts are welcome.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Electron](https://www.electronjs.org)

<div align="center">
  <p>Developed by <a href="https://github.com/AlwaysRead">AlwaysRead</a></p>
  <a href="https://github.com/AlwaysRead/spotify-native-toggler/issues">Report a Bug</a> • 
  <a href="https://github.com/AlwaysRead/spotify-native-toggler/issues">Request a Feature</a>
</div>
