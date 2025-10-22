const { parseAuthHeader, comparePassword } = require('../utils/auth');
const { findUserByLinkId, clearMessages } = require('../utils/storage');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).json({ success: false, error: 'Use DELETE' });

  try {
    const { linkId } = req.query;
    if (!linkId)
      return res.status(400).json({ success: false, error: 'Link ID required' });

    const user = await findUserByLinkId(linkId);
    if (!user)
      return res.status(404).json({ success: false, error: 'User not found' });

    const authHeader = req.headers.authorization;
    const creds = parseAuthHeader(authHeader);
    if (!creds)
      return res.status(401).json({ success: false, error: 'Auth required' });

    const valid = creds.username === user.username &&
      await comparePassword(creds.password, user.password);

    if (!valid)
      return res.status(403).json({ success: false, error: 'Invalid credentials' });

    await clearMessages(linkId);
    return res.status(200).json({ success: true, message: 'All messages deleted successfully!' });
  } catch (e) {
    console.error('Error deleting messages:', e);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
