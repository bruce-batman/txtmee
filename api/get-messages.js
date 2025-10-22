const { parseAuthHeader, comparePassword } = require('../utils/auth');
const { findUserByLinkId, getMessages } = require('../utils/storage');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    const { linkId } = req.query;

    // Validate linkId
    if (!linkId) {
      return res.status(400).json({
        success: false,
        error: 'Link ID is required'
      });
    }

    // ✅ Fixed: Await async DB call
    const user = await findUserByLinkId(linkId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Invalid link. User not found.'
      });
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    const credentials = parseAuthHeader(authHeader);

    if (!credentials) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Secret Messages"');
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Provide username and password.'
      });
    }

    // Verify credentials
    const { username, password } = credentials;
    if (username !== user.username) {
      return res.status(403).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // ✅ Fixed: Await password comparison
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(403).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // ✅ Fixed: Await messages fetch (if async)
    const messages = await getMessages(linkId);

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        username: user.username,
        messageCount: messages.length,
        messages: messages.map(m => ({
          messageId: m.messageId,
          askerName: m.askerName,
          question: m.question,
          createdAt: m.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Error getting messages:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
