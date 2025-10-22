
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://makki971:makki8971@cluster0.n8lg0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'secretmsg';
const usersCol = 'users';
const messagesCol = 'messages';

let client;

async function connect() {
    if (!client) {
        client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
    }
    return client.db(dbName);
}

async function findUserByLinkId(linkId) {
    const db = await connect();
    return db.collection(usersCol).findOne({ linkId });
}

async function findUserByUsername(username) {
    const db = await connect();
    return db.collection(usersCol).findOne({ username });
}

async function addUser(user) {
    const db = await connect();
    await db.collection(usersCol).insertOne(user);
}

async function getMessages(linkId) {
    const db = await connect();
    return db.collection(messagesCol).find({ linkId }).toArray();
}

async function addMessage(message) {
    const db = await connect();
    await db.collection(messagesCol).insertOne(message);
}

async function deleteMessage(linkId, messageId) {
    const db = await connect();
    const result = await db.collection(messagesCol).deleteOne({ linkId, messageId });
    return result.deletedCount === 1;
}

module.exports = {
  findUserByLinkId,
  findUserByUsername,
  addUser,
  getMessages,
  addMessage,
  deleteMessage
};
