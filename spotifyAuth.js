/* NOTE: For local development, use HTTP and 127.0.0.1 (not localhost) for the redirect URI.
 Make sure your .env and Spotify dashboard both use:
 http://127.0.0.1:3000/callback
 For env configuration:
SPOTIFY_CLIENT_ID=_
SPOTIFY_CLIENT_SECRET=_
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/callback*/
const axios = require("axios");
const express = require("express");
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
        res.send("Authentication successful! You can close this window.");
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
      const open = (await import("open")).default;
      await open(getAuthUrl());
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
