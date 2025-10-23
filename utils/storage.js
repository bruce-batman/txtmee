const axios = require('axios');

// === CONFIG ===
const BIN_URL = 'https://api.jsonbin.io/v3/b/68f980cbae596e708f2537fa';
const API_KEY = '$2a$10$aVJi0c6HQUMfEbmKHifNXuz25P7oZXqrlHTNZsAZXJ./DrNPIgE3y';

// === HELPER FUNCTIONS ===

// Read the entire JSON structure from JsonBin
async function readData() {
  try {
    const res = await axios.get(`${BIN_URL}/latest`, {
      headers: { 'X-Master-Key': API_KEY }
    });
    return res.data.record || { users: [], messages: {} };
  } catch (err) {
    console.error('[readData error]', err.response?.status, err.response?.data || err.message);
    return { users: [], messages: {} };
  }
}

// Write the entire JSON structure to JsonBin
async function writeData(data) {
  try {
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

// === EXPORTED METHODS ===

// Find a user by username
exports.findUserByUsername = async (username) => {
  const data = await readData();
  return data.users.find(u => u.username === username);
};

// Find a user by link ID
exports.findUserByLinkId = async (linkId) => {
  const data = await readData();
  return data.users.find(u => u.linkId === linkId);
};

// Add a new user
exports.addUser = async (user) => {
  const data = await readData();
  if (!data.users) data.users = [];
  if (!data.messages) data.messages = {};
  data.users.push(user);
  data.messages[user.linkId] = [];
  await writeData(data);
};

// Add a new message for a specific link ID
exports.addMessage = async (linkId, message) => {
  const data = await readData();
  if (!data.messages) data.messages = {};
  if (!data.messages[linkId]) data.messages[linkId] = [];
  data.messages[linkId].push(message);
  await writeData(data);
};

// Get all messages for a link ID
exports.getMessages = async (linkId) => {
  const data = await readData();
  return data.messages?.[linkId] || [];
};

// Clear all messages for a link ID
exports.clearMessages = async (linkId) => {
  const data = await readData();
  if (!data.messages) data.messages = {};
  data.messages[linkId] = [];
  await writeData(data);
};
