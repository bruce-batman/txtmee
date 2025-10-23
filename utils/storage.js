// utils/storage.js

const fetch = require('node-fetch');
const JSONBIN_URL = 'https://api.jsonbin.io/v3/b/68f980cbae596e708f2537fa/latest';
const JSONBIN_KEY = '$2a$10$aVJi0c6HQUMfEbmKHifNXuz25P7oZXqrlHTNZsAZXJ./DrNPIgE3y';

// ✅ Load data from JSONBin
async function loadData() {
  const res = await fetch(JSONBIN_URL, {
    headers: { 'X-Master-Key': JSONBIN_KEY }
  });
  const json = await res.json();
  return json.record || json;
}

// ✅ Save data back to JSONBin
async function saveData(data) {
  const res = await fetch(JSONBIN_URL.replace('/latest', ''), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_KEY
    },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  return json.record || json;
}

// ✅ Find user by linkId
async function findUserByLinkId(linkId) {
  const data = await loadData();
  return data.users.find(u => u.linkId === linkId);
}

// ✅ Add message safely
async function addMessage(linkId, message) {
  const data = await loadData();
  if (!data.messages) data.messages = {};
  if (!Array.isArray(data.messages[linkId])) data.messages[linkId] = [];
  data.messages[linkId].push(message);
  await saveData(data);
  return true;
}

// ✅ Get messages (important fix!)
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
