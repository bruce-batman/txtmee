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
        await db.collection(MESSAGES_COL).createIndex({ messageId: 1 }, { unique: true });
        
        indexesEnsured = true;
        console.log('MongoDB indexes ensured.');
    } catch (e) {
        console.error('Error ensuring indexes (ignoring if expected, e.g., index already exists):', e.message);
        indexesEnsured = true; // Still mark as true to prevent retries if it's a "key already exists" error
    }
}

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
    await ensureIndexes();
    const { db } = await connect();
    if (!linkId) linkId = makeId(8);
    const doc = {
        username,
        password: passwordHash, 
        linkId,
        createdAt: new Date(),
    };
    const result = await db.collection(USERS_COL).insertOne(doc);
    return result.acknowledged;
}

async function getMessages(linkId) {
    const { db } = await connect();
    // Exclude the MongoDB _id field for cleaner client data
    const cursor = db.collection(MESSAGES_COL).find({ linkId }).project({ _id: 0 }).sort({ createdAt: 1 });
    return cursor.toArray();
}

async function addMessage({ linkId, name, text }) {
    const { db } = await connect();
    const messageId = makeId(12);
    const doc = {
        messageId,
        linkId,
        name: name || 'Anonymous',
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

async function deleteUserAndMessages(linkId) {
    const { db } = await connect();
    const messageResult = await db.collection(MESSAGES_COL).deleteMany({ linkId });
    await db.collection(USERS_COL).deleteOne({ linkId });
    return messageResult.deletedCount;
}

/**
 * --- NEW FUNCTION FOR ADMIN DASHBOARD ---
 * Fetches all user links and embeds their associated messages for a complete view.
 * @returns {Promise<Array<object>>} - Array of user objects with an added 'messages' array.
 */
async function getAllUsersWithMessages() {
    const { db } = await connect();
    const usersCursor = db.collection(USERS_COL).find().project({ password: 0 }); // Exclude password hash
    const users = await usersCursor.toArray();

    // Collect all unique linkIds to fetch messages in bulk
    const linkIds = users.map(user => user.linkId);
    
    // Fetch all messages for all users in one go
    // Exclude the MongoDB _id field
    const messagesCursor = db.collection(MESSAGES_COL).find({ linkId: { $in: linkIds } }).project({ _id: 0 }).sort({ createdAt: 1 });
    const allMessages = await messagesCursor.toArray();
    
    // Map messages to their respective users
    const messagesByLink = allMessages.reduce((acc, message) => {
        if (!acc[message.linkId]) acc[message.linkId] = [];
        acc[message.linkId].push(message);
        return acc;
    }, {});

    // Combine user data with messages
    const finalData = users.map(user => ({
        ...user,
        messages: messagesByLink[user.linkId] || []
    }));

    return finalData;
}


module.exports = {
    findUserByUsername,
    findUserByLinkId,
    addUser,
    getMessages,
    addMessage,
    deleteMessage,
    deleteUserAndMessages,
    getAllUsersWithMessages, // <-- This is the function that was missing!
    ensureIndexes, 
    _connect: connect,
};
