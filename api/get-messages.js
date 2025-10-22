const { parseAuthHeader, comparePassword } = require('../utils/auth');
const { findUserByLinkId, getMessages } = require('../utils/storage');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Use GET' });

  try {
    const { linkId } = req.query;
    if (!linkId)
      return res.status(400).json({ success: false, error: 'Link ID required' });

    const user = await findUserByLinkId(linkId);
    if (!user)
      return res.status(404).json({ success: false, error: 'User not found' });

    const authHeader = req.headers.authorization;
    const creds = parseAuthHeader(authHeader);
    if (!creds) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Messages"');
      return res.status(401).json({ success: false, error: 'Auth required' });
    }

    const valid = creds.username === user.username &&
      await comparePassword(creds.password, user.password);

    if (!valid)
      return res.status(403).json({ success: false, error: 'Invalid credentials' });

    // ✅ Fetch stored messages
    const messages = await getMessages(linkId);

    return res.status(200).json({
      success: true,
      data: {
        username: user.username,
        messageCount: messages.length,
        messages
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
