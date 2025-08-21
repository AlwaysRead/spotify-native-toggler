const fs = require("fs");
const path = require("path");
const os = require("os");

// Path to store user's Spotify app credentials
const credentialsPath = path.join(
  os.homedir(),
  ".spotify-native-toggler",
  "credentials.json"
);

// Ensure the directory exists
function ensureCredentialsDir() {
  const dir = path.dirname(credentialsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Save user's Spotify app credentials
function saveCredentials(clientId, clientSecret) {
  try {
    ensureCredentialsDir();

    const credentials = {
      clientId,
      clientSecret,
      redirectUri: "http://127.0.0.1:3000/callback",
      savedAt: new Date().toISOString(),
    };

    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    console.log("User credentials saved successfully");
    return true;
  } catch (error) {
    console.error("Failed to save credentials:", error);
    return false;
  }
}

// Load user's Spotify app credentials
function loadCredentials() {
  try {
    if (!fs.existsSync(credentialsPath)) {
      console.log("No credentials file found");
      return null;
    }

    const data = fs.readFileSync(credentialsPath, "utf8");
    const credentials = JSON.parse(data);

    console.log("User credentials loaded successfully");
    return credentials;
  } catch (error) {
    console.error("Failed to load credentials:", error);
    return null;
  }
}

// Check if user has set up their credentials
function hasCredentials() {
  const credentials = loadCredentials();
  return credentials && credentials.clientId && credentials.clientSecret;
}

// Clear stored credentials
function clearCredentials() {
  try {
    if (fs.existsSync(credentialsPath)) {
      fs.unlinkSync(credentialsPath);
      console.log("Credentials cleared");
    }
  } catch (error) {
    console.error("Failed to clear credentials:", error);
  }
}

module.exports = {
  saveCredentials,
  loadCredentials,
  hasCredentials,
  clearCredentials,
};
