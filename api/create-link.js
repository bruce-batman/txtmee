const { v4: uuidv4 } = require('uuid');
const { hashPassword } = require('../utils/auth');
const { findUserByUsername, addUser } = require('../utils/storage');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required' 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username must be at least 3 characters long' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if username already exists
    const existingUser = findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: 'Username already exists' 
      });
    }

    // Generate unique link ID
    const linkId = uuidv4();

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create user object
    const user = {
      linkId,
      username,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    // Save user
    addUser(user);

    // Generate the secret link
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';

    const secretLink = `${baseUrl}/message/${linkId}`;

    // Return success response
    return res.status(201).json({
      success: true,
      data: {
        linkId,
        username,
        secretLink,
        message: 'Secret link created successfully! Share this link to receive anonymous messages.'
      }
    });

  } catch (error) {
    console.error('Error creating link:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};
