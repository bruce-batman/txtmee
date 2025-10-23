const { findUserByLinkId, deleteUserAndMessages, findUserByUsername } = require('../utils/storage');
const { parseAuthHeader, comparePassword } = require('../utils/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });

  try {
    // --- 1. Manual Body Parsing (Required for Vercel) ---
    let body = '';
    await new Promise((resolve, reject) => {
      req.on('data', chunk => (body += chunk));
      req.on('end', resolve);
      req.on('error', reject);
    });
    
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid JSON body' });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, error: 'Request body required' });
    }

    const { linkId } = data;
    if (!linkId) {
      return res.status(400).json({ success: false, error: 'linkId is required in the body' });
    }

    // --- 2. Authorization Check (Only link owner can delete) ---
    const linkOwner = await findUserByLinkId(linkId);

    if (!linkOwner) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }

    const authHeader = req.headers.authorization;
    const credentials = parseAuthHeader(authHeader);

    let isAuthorized = false;

    if (credentials) {
      const dbUser = await findUserByUsername(credentials.username);
      if (dbUser && dbUser.linkId === linkId) {
        isAuthorized = await comparePassword(credentials.password, dbUser.password);
      }
    }

    if (!isAuthorized) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Delete Link"');
      return res.status(401).json({ success: false, error: 'Authorization required to delete this link' });
    }

    // --- 3. Delete the user and all their messages ---
    const deletedCount = await deleteUserAndMessages(linkId);

    return res.json({ 
      success: true, 
      message: `Link ${linkId} and ${deletedCount} associated messages deleted successfully.` 
    });

  } catch (e) {
    console.error('Error in dltlink:', e);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
