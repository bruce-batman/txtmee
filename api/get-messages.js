// api/get-messages.js

const { parseAuthHeader, comparePassword } = require('../utils/auth');
const { findUserByLinkId, getMessages } = require('../utils/storage');

module.exports = async (req, res) => {
  // ✅ Allow all origins (for public links)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')
    return res.status(405).json({ success: false, error: 'Use GET' });

  try {
    const { linkId } = req.query;
    if (!linkId)
      return res.status(400).json({ success: false, error: 'Link ID required' });

    // 🔹 Find user associated with this link ID
    const user = await findUserByLinkId(linkId);
    if (!user)
      return res.status(404).json({ success: false, error: 'User not found' });

    // 🔹 Fetch all messages for this user
    let messages = await getMessages(linkId);
    if (!Array.isArray(messages)) messages = [];
    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // newest first

    // 🔹 Try to authenticate if credentials provided
    const authHeader = req.headers.authorization;
    let authorized = false;

    if (authHeader) {
      const creds = parseAuthHeader(authHeader);
      if (creds && creds.username === user.username) {
        const valid = await comparePassword(creds.password, user.password);
        authorized = valid;
      }
    }

    // 🔹 Public view (no login)
    if (!authorized) {
      const publicMessages = messages.map(msg => ({
        question: msg.question,
        createdAt: msg.createdAt
      }));
      return res.status(200).json({
        success: true,
        mode: 'public',
        messageCount: publicMessages.length,
        messages: publicMessages
      });
    }

    // 🔹 Private view (login successful)
    return res.status(200).json({
      success: true,
      mode: 'private',
      username: user.username,
      messageCount: messages.length,
      messages
    });

  } catch (err) {
    console.error('Error fetching messages:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
