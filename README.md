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

| Feature                   | Description                                        |
| ------------------------- | -------------------------------------------------- |
| Global Playback Control   | Play, pause, or skip tracks from any application   |
| Real-Time Display         | View current song title, artist, and album artwork |
| Global Keyboard Shortcuts | Manage playback without switching windows          |
| Secure Authentication     | Utilizes OAuth 2.0 Authorization Code Flow         |
| Low Resource Usage        | Runs efficiently in the background                 |

## ⚠️ Important: Spotify Premium Required

**This application only works with Spotify Premium accounts.** The Spotify Web API restricts playback control (play, pause, skip, volume) to Premium subscribers only. Free Spotify accounts cannot use this application.

**Requirements:**

- ✅ Active Spotify Premium subscription
- ✅ Spotify app installed and running on your device
- ✅ Your own Spotify Developer app (setup instructions below)

## Download

Pre-built binaries for Spotify Native Toggler are available for Windows.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher) - for source builds
- [Spotify Developer Account](https://developer.spotify.com/dashboard) - free
- [Electron](https://www.electronjs.org/) (installed via npm) - for source builds
- **Spotify Premium account** (required for API playback control)

### Setup Instructions

1. **Download and Install**

   Download the latest release for your platform from the [releases page](https://github.com/AlwaysRead/spotify-native-toggler/releases), or build from source:

   ```bash
   git clone https://github.com/AlwaysRead/spotify-native-toggler.git
   cd spotify-native-toggler
   npm install
   ```

2. **Create Your Spotify App** (Required for each user)

   - Visit the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Click "Create App"
   - Fill in any app name (e.g., "My Spotify Controller")
   - Add `http://127.0.0.1:3000/callback` as a Redirect URI
   - Check "Web API" in the APIs section
   - Create the app and note your **Client ID** and **Client Secret**

3. **First Launch Setup**

   When you first run the application, you'll see a setup screen:

   - Enter your Spotify app's **Client ID**
   - Enter your Spotify app's **Client Secret**
   - Click "Save & Continue"

   Your credentials will be stored securely on your local machine and never shared.

## Usage

### Starting the Application

For pre-built binaries, launch the executable. For source builds:

```bash
npm start
```

**First Time Users:**

1. Setup screen → Enter your Spotify app credentials
2. Authentication screen → Click "Connect to Spotify" and log in
3. Main interface → Ready to use!

**Returning Users:**

- App opens directly to the main interface (no repeated authentication required)

### Global Keyboard Shortcuts

| Shortcut         | Action         |
| ---------------- | -------------- |
| Ctrl + Shift + P | Play           |
| Ctrl + Shift + O | Pause          |
| Ctrl + Shift + N | Next Track     |
| Ctrl + Shift + B | Previous Track |

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
