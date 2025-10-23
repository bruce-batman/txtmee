
const bcrypt = require('bcryptjs');
const { findUserByUsername, addUser } = require('../utils/storage');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');

  if (req.method==='OPTIONS') return res.status(200).end();
  if (req.method!=='POST') return res.status(405).json({success:false, error:'Use POST'});

  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({success:false, error:'username and password required'});
    const existing = await findUserByUsername(username);
    if (existing) return res.status(409).json({success:false, error:'username exists'});

    const hash = await bcrypt.hash(password, 10);
    const linkId = (Math.random().toString(36).slice(2,9));
    await addUser({username, passwordHash: hash, linkId});
    return res.json({ success: true, linkId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success:false, error: e.message });
  }
};
