const { MongoClient } = require('mongodb');

// Get URI from environment variable. Fallback to the provided default is risky for production.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://makki971:makki8971@cluster0.n8lg0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = process.env.DB_NAME || 'txtmee';
const USERS_COL = 'users';
const MESSAGES_COL = 'messages';

let clientPromise = null;
let indexesEnsured = false;

/**
 * Establishes a connection to MongoDB and returns the client and database instance.
 * @returns {Promise<{client: MongoClient, db: Db}>}
 */
async function connect() {
  if (!clientPromise) {
    // Ensure URI is available
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables or default.');
    }
    
    // MongoClient.connect options `useNewUrlParser` and `useUnifiedTopology` are now deprecated.
    clientPromise = MongoClient.connect(MONGODB_URI).then(client => {
      console.log('Successfully connected to MongoDB.');
      return client;
    }).catch(err => {
      console.error('Failed to connect to MongoDB:', err);
      clientPromise = null; // Reset promise on failure
      throw err;
    });
  }
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return { client, db };
}

/**
 * Ensures required indexes are created for performance and constraint checking.
 * Only runs once per application instance.
 */
async function ensureIndexes() {
  if (indexesEnsured) return;

  const { db } = await connect();
  try {
    await db.collection(USERS_COL).createIndex({ username: 1 }, { unique: true });
    await db.collection(USERS_COL).createIndex({ linkId: 1 }, { unique: true, sparse: true });
    await db.collection(MESSAGES_COL).createIndex({ linkId: 1 });
    // Using a unique messageId is a good idea
    await db.collection(MESSAGES_COL).createIndex({ messageId: 1 }, { unique: true });
    
    indexesEnsured = true;
    console.log('MongoDB indexes ensured.');
  } catch (e) {
    console.error('Error ensuring indexes (ignoring if expected, e.g., index already exists):', e.message);
    indexesEnsured = true; // Still mark as true to prevent retries if it's a "key already exists" error
  }
}

// ensureIndexes runs automatically when `addUser` is called, but you could call it 
// once on server startup for environments like AWS Lambda/Vercel.

/**
 * Generates a random, URL-safe ID string.
 * @param {number} [len=12] - Length of the ID.
 * @returns {string} - The generated ID.
 */
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
  await ensureIndexes(); // Ensure indexes before insertion

  const { db } = await connect();
  if (!linkId) linkId = makeId(8); // Ensure linkId generation if not provided
  const doc = {
    username,
    password: passwordHash, 
    linkId,
    createdAt: new Date(),
  };
  // Explicitly check for uniqueness failure on insert (though index handles it)
  const result = await db.collection(USERS_COL).insertOne(doc);
  return result.acknowledged;
}

async function getMessages(linkId) {
  const { db } = await connect();
  // Select specific fields for better performance/security if needed: .project({ _id: 0, linkId: 0 })
  const cursor = db.collection(MESSAGES_COL).find({ linkId }).sort({ createdAt: 1 });
  return cursor.toArray();
}

async function addMessage({ linkId, name, text }) {
  const { db } = await connect();
  const messageId = makeId(12);
  const doc = {
    messageId,
    linkId,
    name: name || 'Anonymous', // Use a sensible default
    text,
    createdAt: new Date(),
  };
  await db.collection(MESSAGES_COL).insertOne(doc);
  return doc;
}

async function deleteMessage(linkId, messageId) {
  const { db } = await connect();
  // Deletes only if BOTH linkId and messageId match, ensuring a user only deletes 
  // messages for their link.
  const result = await db.collection(MESSAGES_COL).deleteOne({ linkId, messageId });
  return result.deletedCount === 1;
}

/**
 * Deletes a user and all messages associated with their linkId.
 * @param {string} linkId - The link ID of the user to delete.
 * @returns {Promise<number>} - The number of messages deleted.
 */
async function deleteUserAndMessages(linkId) {
  const { db } = await connect();
  
  // 1. Delete all associated messages
  const messageResult = await db.collection(MESSAGES_COL).deleteMany({ linkId });
  
  // 2. Delete the user account
  await db.collection(USERS_COL).deleteOne({ linkId });
  
  return messageResult.deletedCount;
}


module.exports = {
  findUserByUsername,
  findUserByLinkId,
  addUser,
  getMessages,
  addMessage,
  deleteMessage,
  deleteUserAndMessages, // <-- New function exported
  // Exported for environments where immediate index creation is needed
  ensureIndexes, 
  // exported for testing/debug
  _connect: connect,
};
