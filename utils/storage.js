// utils/storage.js

const BIN_ID = '68f980cbae596e708f2537fa';
const JSONBIN_KEY = '$2a$10$aVJi0c6HQUMfEbmKHifNXuz25P7oZXqrlHTNZsAZXJ./DrNPIgE3y';

const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const READ_URL = `${BASE_URL}/latest`;

async function loadData() {
  try {
    const res = await fetch(READ_URL, {
      headers: { 'X-Master-Key': JSONBIN_KEY }
    });

    if (!res.ok) {
      console.error(`Load failed: ${res.status} ${res.statusText}`);
      if (res.status === 404) {
        console.warn('Bin not found — creating new.');
        await saveData({ users: [], messages: {} });
        return { users: [], messages: {} };
      }
      throw new Error(`JSONBin load failed (${res.status})`);
    }

    const json = await res.json();
    return json.record || json;
  } catch (err) {
    console.error('Error loading JSONBin:', err.message);
    return { users: [], messages: {} };
  }
}

async function saveData(data) {
  try {
    const res = await fetch(BASE_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_KEY
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error(`Save failed: ${res.status} ${res.statusText}`);
    const json = await res.json();
    return json.record || json;
  } catch (err) {
    console.error('Error saving JSONBin:', err.message);
    throw err;
  }
}

async function findUserByLinkId(linkId) {
  const data = await loadData();
  return data.users.find(u => u.linkId === linkId);
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
  const messages = data.messages?.[linkId] || [];
  return Array.isArray(messages) ? messages : [];
}

module.exports = { findUserByLinkId, addMessage, getMessages };
