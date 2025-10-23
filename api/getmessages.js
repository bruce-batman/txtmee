// api/getmessages.js
const { findUserByLinkId, getMessages } = require('../utils/storage');
const { parseAuthHeader, comparePassword } = require('../utils/auth'); // Import auth utilities
const { findUserByUsername } = require('../utils/storage'); // Need this for authentication

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Added Authorization header

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed. Use GET.' });

  try {
    const { linkId } = req.query;

    if (!linkId) {
      return res.status(400).json({ success: false, error: 'linkId query parameter is required' });
    }

    // 1. Check if the linkId exists
    const linkOwner = await findUserByLinkId(linkId);

    if (!linkOwner) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }

    // 2. --- START: Authorization Check (New Security Layer) ---

    const authHeader = req.headers.authorization;
    const credentials = parseAuthHeader(authHeader);

    let isAuthorized = false;

    if (credentials) {
      const { username, password } = credentials;
      const dbUser = await findUserByUsername(username);

      if (dbUser && dbUser.linkId === linkId) {
        // Compare the provided password with the stored hash
        isAuthorized = await comparePassword(password, dbUser.password);
      }
    }

    if (!isAuthorized) {
      // Respond with 401 Unauthorized and prompt for Basic Auth credentials
      res.setHeader('WWW-Authenticate', 'Basic realm="Access Messages"');
      return res.status(401).json({ success: false, error: 'Authorization required to view messages' });
    }
    // --- END: Authorization Check ---


    // 3. Fetch and return messages (only if authorized)
    const messages = await getMessages(linkId);

    return res.json({ success: true, messages });

  } catch (e) {
    console.error('Error in getmessages:', e);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
