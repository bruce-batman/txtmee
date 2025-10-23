const axios = require('axios');

// === CONFIG ===
const BIN_URL = 'https://api.jsonbin.io/v3/b/68f980cbae596e708f2537fa';
const API_KEY = '$2a$10$aVJi0c6HQUMfEbmKHifNXuz25P7oZXqrlHTNZsAZXJ./DrNPIgE3y';

// === INTERNAL HELPERS ===

// Read data from JsonBin (latest version)
async function readData() {
  try {
    const res = await axios.get(`${BIN_URL}/latest`, {
      headers: { 'X-Master-Key': API_KEY }
    });

    // Always return valid structure
    const record = res.data.record || {};
    if (!record.users || !Array.isArray(record.users)) record.users = [];
    if (!record.messages || typeof record.messages !== 'object' || Array.isArray(record.messages)) {
      record.messages = {};
    }
    return record;
  } catch (err) {
    console.error('[readData error]', err.response?.status, err.response?.data || err.message);
    return { users: [], messages: {} };
  }
}

// Write data to JsonBin (PUT overwrites bin)
async function writeData(data) {
  try {
    // Ensure valid structure before writing
    if (!data.users || !Array.isArray(data.users)) data.users = [];
    if (!data.messages || typeof data.messages !== 'object' || Array.isArray(data.messages)) {
      data.messages = {};
    }

    await axios.put(BIN_URL, data, {
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      }
    });
  } catch (err) {
    console.error('[writeData error]', err.response?.status, err.response?.data || err.message);
  }
}

// === PUBLIC FUNCTIONS ===

// Find a user by username
exports.findUserByUsername = async (username) => {
  const data = await readData();
  return data.users.find(u => u.username === username);
};

// Find a user by linkId
exports.findUserByLinkId = async (linkId) => {
  const data = await readData();
  return data.users.find(u => u.linkId === linkId);
};

// Add new user
exports.addUser = async (user) => {
  const data = await readData();
  if (!data.users.find(u => u.linkId === user.linkId)) {
    data.users.push(user);
  }
  if (!data.messages[user.linkId]) data.messages[user.linkId] = [];
  await writeData(data);
};

// Add new message for a specific link
exports.addMessage = async (linkId, message) => {
  const data = await readData();

  // ✅ Auto-fix structure permanently
  if (!data.messages || typeof data.messages !== 'object' || Array.isArray(data.messages)) {
    data.messages = {};
  }
  if (!data.messages[linkId]) data.messages[linkId] = [];

  data.messages[linkId].push(message);
  await writeData(data);
};

// Get all messages for a given link
exports.getMessages = async (linkId) => {
  const data = await readData();
  if (!data.messages || typeof data.messages !== 'object') return [];
  return data.messages[linkId] || [];
};

// Clear all messages for a link
exports.clearMessages = async (linkId) => {
  const data = await readData();

  // ✅ Auto-fix structure again for safety
  if (!data.messages || typeof data.messages !== 'object' || Array.isArray(data.messages)) {
    data.messages = {};
  }

  data.messages[linkId] = [];
  await writeData(data);
};
