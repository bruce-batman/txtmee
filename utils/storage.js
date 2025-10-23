const BIN_ID = '68f980cbae596e708f2537fa';
const JSONBIN_KEY = '$2a$10$aVJi0c6HQUMfEbmKHifNXuz25P7oZXqrlHTNZsAZXJ./DrNPIgE3y';

const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const READ_URL = `${BASE_URL}/latest`;

async function loadData() {
  try {
    const res = await fetch(READ_URL, {
      headers: { 'X-Master-Key': JSONBIN_KEY }
    });
    if (!res.ok) throw new Error(`Failed to load bin (${res.status})`);
    const json = await res.json();
    return json.record || json;
  } catch (err) {
    console.error('Error loading JSONBin:', err.message);
    return { users: [], messages: {} };
  }
}

async function saveData(data) {
  const res = await fetch(BASE_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_KEY
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  return true;
}

async function findUserByLinkId(linkId) {
  const data = await loadData();
  return data.users.find(u => u.linkId === linkId);
}

async function findUserByUsername(username) {
  const data = await loadData();
  return data.users.find(u => u.username === username);
}

async function addUser(user) {
  const data = await loadData();
  data.users.push(user);
  await saveData(data);
  return user;
}

async function addMessage(linkId, message) {
  const data = await loadData();
  if (!data.messages) data.messages = {};
  if (!Array.isArray(data.messages[linkId])) data.messages[linkId] = [];
  data.messages[linkId].push(message);
  await saveData(data);
  return true;
}

async function getMessages(linkId) {
  const data = await loadData();
  return Array.isArray(data.messages?.[linkId]) ? data.messages[linkId] : [];
}

module.exports = { loadData, saveData, findUserByLinkId, findUserByUsername, addUser, addMessage, getMessages };
