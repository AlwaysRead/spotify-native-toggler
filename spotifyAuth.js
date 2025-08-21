/* NOTE: Users must create their own Spotify app and provide credentials.
 Make sure the Spotify app dashboard uses:
 http://127.0.0.1:3000/callback
 as the redirect URI. */
const axios = require("axios");
const express = require("express");
const { shell } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { loadCredentials } = require("./src/credentialsManager");

// Load user's Spotify app credentials
let CLIENT_ID = null;
let CLIENT_SECRET = null;
let REDIRECT_URI = "http://127.0.0.1:3000/callback";

function loadUserCredentials() {
  const credentials = loadCredentials();
  if (credentials) {
    CLIENT_ID = credentials.clientId;
    CLIENT_SECRET = credentials.clientSecret;
    REDIRECT_URI = credentials.redirectUri || "http://127.0.0.1:3000/callback";

    console.log("User credentials loaded:");
    console.log("CLIENT_ID:", CLIENT_ID);
    console.log("CLIENT_SECRET:", CLIENT_SECRET ? "Set" : "Not set");
    console.log("REDIRECT_URI:", REDIRECT_URI);
  } else {
    console.log("No user credentials found - setup required");
  }
}

let accessToken = null;
let refreshToken = null;

// Path to store tokens securely
const tokenPath = path.join(
  os.homedir(),
  ".spotify-native-toggler",
  "tokens.json"
);

// Load saved tokens on startup
function loadTokens() {
  try {
    if (fs.existsSync(tokenPath)) {
      const tokenData = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
      accessToken = tokenData.accessToken;
      refreshToken = tokenData.refreshToken;
      console.log("Tokens loaded from disk");
      return true;
    }
  } catch (error) {
    console.error("Error loading tokens:", error);
  }
  return false;
}

// Save tokens to disk
function saveTokens() {
  try {
    const tokenDir = path.dirname(tokenPath);
    if (!fs.existsSync(tokenDir)) {
      fs.mkdirSync(tokenDir, { recursive: true });
    }

    const tokenData = {
      accessToken,
      refreshToken,
      timestamp: Date.now(),
    };

    fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2));
    console.log("Tokens saved to disk");
  } catch (error) {
    console.error("Error saving tokens:", error);
  }
}

// Clear saved tokens
function clearTokens() {
  try {
    if (fs.existsSync(tokenPath)) {
      fs.unlinkSync(tokenPath);
      console.log("Tokens cleared from disk");
    }
    accessToken = null;
    refreshToken = null;
  } catch (error) {
    console.error("Error clearing tokens:", error);
  }
}

// Check if user has Spotify Premium (required for playback control)
async function checkPremiumStatus(userData) {
  if (userData && userData.product) {
    if (userData.product === "premium") {
      console.log("✅ Spotify Premium account detected");
      return true;
    } else {
      console.log(
        "❌ Spotify Premium required - Current plan:",
        userData.product
      );
      throw new Error(
        `Spotify Premium required. Your current plan: ${userData.product}. This app only works with Premium accounts due to Spotify API restrictions.`
      );
    }
  } else {
    console.log("⚠️  Could not determine Spotify subscription type");
    // Don't throw error here, let the user try to use the app
    return false;
  }
}

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
  // Load user's credentials first
  loadUserCredentials();

  // Check if credentials are available
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "No Spotify app credentials found. Please run setup first."
    );
  }

  // Load existing tokens
  loadTokens();

  // If we have tokens, try to verify they work
  if (accessToken && refreshToken) {
    try {
      // Test the access token by making a simple API call
      const response = await axios.get("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 200) {
        console.log("Existing tokens are valid");

        // Check if user has Premium (required for playback control)
        await checkPremiumStatus(response.data);

        return; // Authentication successful with existing tokens
      }
    } catch (error) {
      console.log("Access token expired, trying refresh...");

      // Try to refresh the token
      try {
        await refreshAccessToken();
        console.log("Token refreshed successfully");
        return; // Authentication successful with refreshed token
      } catch (refreshError) {
        console.log("Refresh failed, need new authentication");
        clearTokens(); // Clear invalid tokens
      }
    }
  }

  // If we get here, we need fresh authentication
  console.log("Starting fresh authentication...");
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

        // Save tokens to disk for future use
        saveTokens();

        // Check if user has Premium (required for playback control)
        try {
          const userResponse = await axios.get(
            "https://api.spotify.com/v1/me",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          await checkPremiumStatus(userResponse.data);
        } catch (premiumError) {
          console.error("Premium check failed:", premiumError.message);
          // Continue anyway - the error will be shown later when they try to use controls
        }

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
        console.error("Token exchange error:");
        console.error("Status:", err.response?.status);
        console.error("Status Text:", err.response?.statusText);
        console.error("Error Data:", err.response?.data);
        console.error("Request URL:", err.config?.url);
        console.error("Request Data (partial):", err.config?.data?.substring(0, 200) + "...");
        
        // Send detailed error response
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Authentication Error</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
                background: linear-gradient(135deg, #ff4444, #cc0000);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
              }
              .error-container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 40px;
                max-width: 500px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
              }
              .error-icon {
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
              p { margin: 10px 0; opacity: 0.9; font-size: 16px; }
              .error-details {
                background: rgba(0, 0, 0, 0.3);
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
                text-align: left;
                font-family: monospace;
                font-size: 14px;
              }
              .retry-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                margin-top: 20px;
                transition: background 0.3s ease;
              }
              .retry-btn:hover {
                background: rgba(255, 255, 255, 0.3);
              }
            </style>
          </head>
          <body>
            <div class="error-container">
              <div class="error-icon">✗</div>
              <h1>Authentication Failed</h1>
              <p>There was an error exchanging the authorization code for tokens.</p>
              <div class="error-details">
                <strong>Error:</strong> ${err.response?.data?.error || 'Unknown error'}<br>
                <strong>Description:</strong> ${err.response?.data?.error_description || err.message}<br>
                <strong>Status:</strong> ${err.response?.status || 'Unknown'}
              </div>
              <p>Please check your Spotify app credentials and try again.</p>
              <button class="retry-btn" onclick="window.close()">Close</button>
            </div>
          </body>
          </html>
        `);
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

  // Save updated tokens to disk
  saveTokens();
}

function getAccessToken() {
  return accessToken;
}

module.exports = { authenticate, getAccessToken, refreshAccessToken };

console.log("Access Token:", accessToken);
