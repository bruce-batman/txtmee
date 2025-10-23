// api/createlink.js
const { findUserByUsername, addUser } = require('../utils/storage');
const { hashPassword } = require('../utils/auth'); // Use dedicated auth utility

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });

  try {
    let data = req.body;

    // --- START: Manual Body Parsing (Uncomment if req.body is undefined, e.g., on Vercel without bodyParser) ---
    // If Vercel/environment does not automatically parse the body, use this:
    /*
    let body = '';
    await new Promise((resolve, reject) => {
      req.on('data', chunk => (body += chunk));
      req.on('end', resolve);
      req.on('error', reject);
    });

    try {
      data = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid JSON body' });
    }
    */
    // --- END: Manual Body Parsing ---


    // Check if data is present and correctly parsed
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, error: 'Request body required' });
    }

    const { username, password } = data;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'username and password are required' });
    }

    const existing = await findUserByUsername(username);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }

    // Use the dedicated hashing utility
    const passwordHash = await hashPassword(password);
    
    // Create a simple, URL-safe linkId. The makeId in storage.js is better, 
    // but keeping this for consistency with original if you're not using makeId here.
    const linkId = Math.random().toString(36).slice(2, 9); 
    
    await addUser({ username, passwordHash, linkId });
    
    // Don't expose the username or passwordHash back to the client
    return res.status(201).json({ success: true, linkId, message: 'Link created successfully' });

  } catch (e) {
    console.error('Error in createlink:', e);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
