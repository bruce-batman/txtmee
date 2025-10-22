const { parseAuthHeader, comparePassword } = require('../utils/auth');
const { findUserByLinkId, deleteMessage } = require('../utils/storage');

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

  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use DELETE.' 
    });
  }

  try {
    const { linkId, messageId } = req.query;

    // Validate input
    if (!linkId || !messageId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Link ID and Message ID are required' 
      });
    }

    // Check if user exists
    const user = findUserByLinkId(linkId);
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

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Delete message
    const deleted = deleteMessage(linkId, messageId);

    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        error: 'Message not found' 
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      data: {
        messageId
      }
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};
