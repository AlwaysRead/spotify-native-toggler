/* NOTE: For local development, use HTTP and 127.0.0.1 (not localhost) for the redirect URI.
 Make sure your .env and Spotify dashboard both use:
 http://127.0.0.1:3000/callback
 For env configuration:
SPOTIFY_CLIENT_ID=_
SPOTIFY_CLIENT_SECRET=_
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/callback*/
const axios = require("axios");
const express = require("express");
const { shell } = require("electron");
require("dotenv").config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
let REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

console.log("Environment variables loaded:");
console.log("CLIENT_ID:", CLIENT_ID);
console.log("CLIENT_SECRET:", CLIENT_SECRET ? "Set" : "Not set");
console.log("REDIRECT_URI:", REDIRECT_URI);

let accessToken = null;
let refreshToken = null;

function getAuthUrl() {
  const scope = [
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "streaming",
    "user-read-email",
    "user-read-private",
  ].join(" ");
  return (
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      scope,
      redirect_uri: REDIRECT_URI,
    }).toString()
  );
}

async function authenticate() {
  return new Promise((resolve, reject) => {
    const app = express();
    let server;

    app.get("/callback", async (req, res) => {
      const code = req.query.code;
      if (!code) {
        res.send("No code found in callback.");
        reject("No code in callback");
        server.close();
        return;
      }
      try {
        const tokenRes = await axios.post(
          "https://accounts.spotify.com/api/token",
          new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );
        accessToken = tokenRes.data.access_token;
        refreshToken = tokenRes.data.refresh_token;

        // Send a styled success page that auto-closes
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Authentication Successful</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
                background: linear-gradient(135deg, #1db954, #1ed760);
                color: white;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
              }
              .success-container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
              }
              .checkmark {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 30px;
              }
              h1 { margin: 0 0 10px 0; font-size: 24px; font-weight: 600; }
              p { margin: 0; opacity: 0.9; font-size: 16px; }
            </style>
          </head>
          <body>
            <div class="success-container">
              <div class="checkmark">✓</div>
              <h1>Authentication Successful!</h1>
              <p>You can close this window.</p>
            </div>
            <script>
              // Auto-close after 2 seconds
              setTimeout(() => {
                window.close();
              }, 2000);
            </script>
          </body>
          </html>
        `);
        resolve();
      } catch (err) {
        console.error(
          "Token exchange error:",
          err.response?.data || err.message
        );
        res.send("Error exchanging code for token.");
        reject(err);
      } finally {
        setTimeout(() => server.close(), 1000);
      }
    });

    server = app.listen(3000, "127.0.0.1", async () => {
      // Use Electron's shell to open the URL
      await shell.openExternal(getAuthUrl());
    });
  });
}

async function refreshAccessToken() {
  if (!refreshToken) throw new Error("No refresh token available");
  const tokenRes = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  accessToken = tokenRes.data.access_token;
  if (tokenRes.data.refresh_token) {
    refreshToken = tokenRes.data.refresh_token;
  }
}

function getAccessToken() {
  return accessToken;
}

module.exports = { authenticate, getAccessToken, refreshAccessToken };

console.log("Access Token:", accessToken);
