const bcrypt = require('bcryptjs');
const { findUserByUsername, addUser } = require('../utils/storage');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, error: 'Use POST' });

  try {
    // Manually parse JSON if needed (Vercel sometimes sends raw text)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ success: false, error: 'Invalid JSON body' });
      }
    }

    const { username, password } = body || {};
    if (!username || !password)
      return res.status(400).json({ success: false, error: 'Username and password required' });

    const existing = await findUserByUsername(username);
    if (existing)
      return res.status(400).json({ success: false, error: 'Username already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const linkId = Math.random().toString(36).substring(2, 10);

    const newUser = {
      linkId,
      username,
      password: hashed,
      createdAt: new Date().toISOString()
    };

    await addUser(newUser);

    res.status(201).json({
      success: true,
      data: {
        secretLink: `https://asklyy.vercel.app/${linkId}`,
        linkId
      }
    });
  } catch (err) {
    console.error('Error creating link:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
