const bcrypt = require('bcryptjs');
const { addUser, findUserByUsername } = require('../utils/storage');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST' });

  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ success: false, error: 'Username and password required' });

    const existing = await findUserByUsername(username);
    if (existing)
      return res.status(400).json({ success: false, error: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const linkId = Math.random().toString(36).substring(2, 10);

    const user = { username, password: hashedPassword, linkId, createdAt: new Date().toISOString() };
    await addUser(user);

    const secretLink = `https://asklyy.vercel.app/${linkId}`;

    return res.status(201).json({
      success: true,
      data: { secretLink, linkId }
    });
  } catch (e) {
    console.error('Error creating link:', e);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
