const fs = require('fs').promises;
const path = require('path');
const DATA_PATH = path.join(__dirname, 'storage.json');

async function readData() {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { users: [], messages: {} };
  }
}

async function writeData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

exports.findUserByUsername = async (username) => {
  const data = await readData();
  return data.users.find(u => u.username === username);
};

exports.findUserByLinkId = async (linkId) => {
  const data = await readData();
  return data.users.find(u => u.linkId === linkId);
};

exports.addUser = async (user) => {
  const data = await readData();
  data.users.push(user);
  data.messages[user.linkId] = [];
  await writeData(data);
};

exports.addMessage = async (linkId, message) => {
  const data = await readData();
  if (!data.messages[linkId]) data.messages[linkId] = [];
  data.messages[linkId].push(message);
  await writeData(data);
};

exports.getMessages = async (linkId) => {
  const data = await readData();
  return data.messages[linkId] || [];
};

exports.clearMessages = async (linkId) => {
  const data = await readData();
  data.messages[linkId] = [];
  await writeData(data);
};
