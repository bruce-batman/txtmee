const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data', 'messages.json');

/**
 * Read data from JSON file
 * @returns {object} - Data object
 */
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
    return { users: [], messages: [] };
  } catch (error) {
    console.error('Error reading data:', error);
    return { users: [], messages: [] };
  }
}

/**
 * Write data to JSON file
 * @param {object} data - Data object to write
 */
function writeData(data) {
  try {
    const dirPath = path.dirname(DATA_FILE);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing data:', error);
    throw error;
  }
}

/**
 * Find user by linkId
 * @param {string} linkId - User's link ID
 * @returns {object|null} - User object or null
 */
function findUserByLinkId(linkId) {
  const data = readData();
  return data.users.find(u => u.linkId === linkId) || null;
}

/**
 * Find user by username
 * @param {string} username - Username
 * @returns {object|null} - User object or null
 */
function findUserByUsername(username) {
  const data = readData();
  return data.users.find(u => u.username === username) || null;
}

/**
 * Add new user
 * @param {object} user - User object
 */
function addUser(user) {
  const data = readData();
  data.users.push(user);
  writeData(data);
}

/**
 * Get messages for a user
 * @param {string} linkId - User's link ID
 * @returns {array} - Array of messages
 */
function getMessages(linkId) {
  const data = readData();
  return data.messages.filter(m => m.linkId === linkId);
}

/**
 * Add new message
 * @param {object} message - Message object
 */
function addMessage(message) {
  const data = readData();
  data.messages.push(message);
  writeData(data);
}

/**
 * Delete message by ID
 * @param {string} linkId - User's link ID
 * @param {string} messageId - Message ID to delete
 * @returns {boolean} - True if deleted, false otherwise
 */
function deleteMessage(linkId, messageId) {
  const data = readData();
  const initialLength = data.messages.length;
  data.messages = data.messages.filter(
    m => !(m.linkId === linkId && m.messageId === messageId)
  );

  if (data.messages.length < initialLength) {
    writeData(data);
    return true;
  }
  return false;
}

module.exports = {
  readData,
  writeData,
  findUserByLinkId,
  findUserByUsername,
  addUser,
  getMessages,
  addMessage,
  deleteMessage
};
