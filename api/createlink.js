// api/createlink.js
const { findUserByUsername, addUser } = require('../utils/storage');
const { hashPassword } = require('../utils/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });

  try {
    // ✅ Re-enable Manual Body Parsing (Crucial for environments like Vercel)
    let body = '';
    await new Promise((resolve, reject) => {
      req.on('data', chunk => (body += chunk));
      req.on('end', resolve);
      req.on('error', reject);
    });

    let data;
    try {
      data = JSON.parse(body); // This is where the original error likely occurred
    } catch (e) {
      // Handle JSON parsing errors explicitly
      return res.status(400).json({ success: false, error: 'Invalid JSON body: ' + e.message });
    }
    
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

    const passwordHash = await hashPassword(password);
    const linkId = Math.random().toString(36).slice(2, 9);
    
    await addUser({ username, passwordHash, linkId });
    
    return res.status(201).json({ success: true, linkId, message: 'Link created successfully' });

  } catch (e) {
    console.error('Error in createlink:', e);
    // Log the specific error message to help debug in your logs
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
