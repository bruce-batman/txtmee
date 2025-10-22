const crypto = require('crypto');
const { hashPassword } = require('../utils/auth');
const { findUserByUsername, addUser } = require('../utils/storage');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST' });

  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, error: 'Username and password required' });

    const existingUser = await findUserByUsername(username);
    if (existingUser)
      return res.status(409).json({ success: false, error: 'Username already exists' });

    const linkId = crypto.randomBytes(4).toString('hex');
    const hashed = await hashPassword(password);

    await addUser({ linkId, username, password: hashed, createdAt: new Date().toISOString() });

    const secretLink = `https://txtmee-lg17.vercel.app/${linkId}`;
    return res.status(201).json({
      success: true,
      data: { linkId, username, secretLink, message: 'Secret link created successfully!' }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
