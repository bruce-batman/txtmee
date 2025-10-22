const axios = require('axios');

const BIN_URL = 'https://api.npoint.io/ad7c527f7ded013ac415'; // replace with your bin URL

async function readData() {
  const res = await axios.get(BIN_URL);
  return res.data || { users: [], messages: {} };
}

async function writeData(data) {
  await axios.put(BIN_URL, data); // jsonbin/npoint allows write with PUT
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
