// api/get-messages.js
const { parseAuthHeader, comparePassword } = require('../utils/auth');
const { findUserByLinkId, getMessages } = require('../utils/storage');

module.exports = async (req, res) => {
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

    const user = await findUserByLinkId(linkId);
    if (!user)
      return res.status(404).json({ success: false, error: 'User not found' });

    let messages = await getMessages(linkId);
    if (!Array.isArray(messages)) messages = [];
    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const authHeader = req.headers.authorization;
    let authorized = false;

    if (authHeader) {
      const creds = parseAuthHeader(authHeader);
      if (creds && creds.username === user.username) {
        const valid = await comparePassword(creds.password, user.password);
        authorized = valid;
      }
    }

    if (!authorized) {
      const publicMessages = messages.map(m => ({
        question: m.question,
        createdAt: m.createdAt
      }));
      return res.status(200).json({
        success: true,
        mode: 'public',
        messages: publicMessages
      });
    }

    return res.status(200).json({
      success: true,
      mode: 'private',
      username: user.username,
      messages
    });
  } catch (err) {
    console.error('Error fetching messages:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
