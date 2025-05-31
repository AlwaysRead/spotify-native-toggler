<div align="center">
  
# Spotify Native Toggler

**Control your Spotify playback without switching windows**

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Screenshots](#screenshots) • [Contributing](#contributing) • [License](#license)

</div>

## Overview

Spotify Native Toggler is a lightweight desktop application that provides global control over your Spotify playback from anywhere on your system. No more Alt+Tab interruptions during your workflow!

### Why This Exists

Windows 11 lacks a universal media controller, making it frustrating to manage music while deep in other tasks. Whether you're:
- Gaming intensely
- In a coding flow state
- Working across multiple applications

This tool ensures your music is always just a keyboard shortcut away.

## Features

| Feature | Description |
|---------|-------------|
| **Global Playback Control** | Play, pause, and skip tracks from any application |
| **Real-time Display** | View current song title, artist, and album artwork |
| **Global Keyboard Shortcuts** | Control music without opening the app window |
| **Secure Authentication** | OAuth 2.0 integration with Spotify (Authorization Code Flow) |
| **Minimal Resource Usage** | Lightweight design to avoid system slowdown |

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [Spotify Developer Account](https://developer.spotify.com/dashboard/applications)
- [Electron](https://www.electronjs.org/) (installed via npm)
- **Spotify Premium** account (required by Spotify API for playback control)

### Setup

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
   Create a `.env` file in the project root:
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

   | Shortcut | Action |
   |----------|--------|
   | `Ctrl+Shift+P` | Play |
   | `Ctrl+Shift+O` | Pause |
   | `Ctrl+Shift+N` | Next Track |
   | `Ctrl+Shift+B` | Previous Track |

3. **App Interface**
   - View current song information and album artwork
   - Use on-screen controls for playback

## Screenshots

<div align="center">
  <img src="snapshots/image2.png" alt="Main Interface" width="600">
  <p><em>Main interface with playback controls and volume slider</em></p>
</div>

> **Note:** The UI/UX design is currently a work in progress. I'm actively working on improving the UI looks and overall layout. I am really bad at CSS. You can reach out to me if you want to help :)!

## Development

### Project Structure

```
spotify-native-toggler/
├── src/
│   ├── main.js       # Main Electron process
│   ├── renderer.js   # Renderer process
│   └── auth.js       # Spotify authentication
├── assets/           # App icons and images
├── public/           # Static files
└── snapshots/        # Screenshots
```

### Building from Source

```bash
# Install all dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) for making this integration possible
- [Electron](https://www.electronjs.org/) for the cross-platform desktop framework

---

<div align="center">
  <p>Made with by <a href="https://github.com/AlwaysRead">AlwaysRead</a></p>
  
  <a href="https://github.com/AlwaysRead/spotify-native-toggler/issues">Report Bug</a>
  •
  <a href="https://github.com/AlwaysRead/spotify-native-toggler/issues">Request Feature</a>
</div>
