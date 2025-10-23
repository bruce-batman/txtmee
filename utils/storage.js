
/**
 * MongoDB-backed storage module.
 * Exports:
 *  - findUserByUsername(username)
 *  - findUserByLinkId(linkId)
 *  - addUser({username, passwordHash, linkId})
 *  - getMessages(linkId)
 *  - addMessage({linkId, name, text})
 *  - deleteMessage(linkId, messageId)
 *
 * Environment variables:
 *  - MONGODB_URI (required)  e.g. "mongodb://localhost:27017"
 *  - DB_NAME (optional) default: "txtmee"
 *
 * Notes:
 *  - Use this in production instead of file-based storage.json.
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://makki971:makki8971@cluster0.n8lg0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = process.env.DB_NAME || 'txtmee';
const USERS_COL = 'users';
const MESSAGES_COL = 'messages';

let clientPromise = null;

async function connect() {
  if (!clientPromise) {
    clientPromise = MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(client => client);
  }
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return { client, db };
}

async function ensureIndexes() {
  const { db } = await connect();
  try {
    await db.collection(USERS_COL).createIndex({ username: 1 }, { unique: true });
    await db.collection(USERS_COL).createIndex({ linkId: 1 }, { unique: true, sparse: true });
    await db.collection(MESSAGES_COL).createIndex({ linkId: 1 });
    await db.collection(MESSAGES_COL).createIndex({ messageId: 1 }, { unique: true });
  } catch (e) {
    // ignore index errors (e.g., already exists)
  }
}

// generate stable-ish id
function makeId(len = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function findUserByUsername(username) {
  const { db } = await connect();
  return db.collection(USERS_COL).findOne({ username });
}

async function findUserByLinkId(linkId) {
  const { db } = await connect();
  return db.collection(USERS_COL).findOne({ linkId });
}

async function addUser({ username, passwordHash, linkId }) {
  const { db } = await connect();
  if (!linkId) linkId = makeId(8);
  const doc = {
    username,
    password: passwordHash,
    linkId,
    createdAt: new Date(),
  };
  await db.collection(USERS_COL).insertOne(doc);
  await ensureIndexes();
  return true;
}

async function getMessages(linkId) {
  const { db } = await connect();
  const cursor = db.collection(MESSAGES_COL).find({ linkId }).sort({ createdAt: 1 });
  return cursor.toArray();
}

async function addMessage({ linkId, name, text }) {
  const { db } = await connect();
  const messageId = makeId(12);
  const doc = {
    messageId,
    linkId,
    name: name || null,
    text,
    createdAt: new Date(),
  };
  await db.collection(MESSAGES_COL).insertOne(doc);
  return doc;
}

async function deleteMessage(linkId, messageId) {
  const { db } = await connect();
  const result = await db.collection(MESSAGES_COL).deleteOne({ linkId, messageId });
  return result.deletedCount === 1;
}

module.exports = {
  findUserByUsername,
  findUserByLinkId,
  addUser,
  getMessages,
  addMessage,
  deleteMessage,
  // exported for testing/debug
  _connect: connect,
};
