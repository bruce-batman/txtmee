// utils/storage.js
const fetch = require('node-fetch');

// Your JSONBin credentials
const BIN_ID = '68f980cbae596e708f2537fa';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const JSONBIN_READ_URL = `${JSONBIN_URL}/latest`;
const JSONBIN_KEY = '$2a$10$aVJi0c6HQUMfEbmKHifNXuz25P7oZXqrlHTNZsAZXJ./DrNPIgE3y';

// ✅ Load the whole database from JSONBin
async function loadData() {
  try {
    const res = await fetch(JSONBIN_READ_URL, {
      headers: { 'X-Master-Key': JSONBIN_KEY }
    });
    if (!res.ok) throw new Error(`JSONBin load failed: ${res.status}`);
    const json = await res.json();
    return json.record || json;
  } catch (err) {
    console.error('Error loading JSONBin:', err.message);
    return { users: [], messages: {} };
  }
}

// ✅ Save the full database back to JSONBin
async function saveData(data) {
  try {
    const res = await fetch(JSONBIN_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_KEY
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`JSONBin save failed: ${res.status}`);
    const json = await res.json();
    return json.record || json;
  } catch (err) {
    console.error('Error saving JSONBin:', err.message);
    throw err;
  }
}

// ✅ Find a user by their linkId
async function findUserByLinkId(linkId) {
  const data = await loadData();
  return data.users.find(u => u.linkId === linkId);
}

// ✅ Add a message safely (auto creates message list)
async function addMessage(linkId, message) {
  const data = await loadData();
  if (!data.messages) data.messages = {};
  if (!Array.isArray(data.messages[linkId])) data.messages[linkId] = [];
  data.messages[linkId].push(message);
  await saveData(data);
  return true;
}

// ✅ Get all messages for a linkId
async function getMessages(linkId) {
  const data = await loadData();
  if (!data.messages) return [];
  const msgs = data.messages[linkId];
  return Array.isArray(msgs) ? msgs : [];
}

module.exports = {
  findUserByLinkId,
  addMessage,
  getMessages
};
