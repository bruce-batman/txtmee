
const { findUserByLinkId, addMessage } = require('../utils/storage');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');

  if (req.method==='OPTIONS') return res.status(200).end();
  if (req.method!=='POST') return res.status(405).json({success:false, error:'Use POST'});

  try {
    const { linkId, name, text } = req.body || {};
    if (!linkId || !text) return res.status(400).json({success:false, error:'linkId and text required'});
    const user = await findUserByLinkId(linkId);
    if (!user) return res.status(404).json({success:false, error:'link not found'});
    const msg = await addMessage({linkId, name, text});
    return res.json({success:true, message: msg});
  } catch (e) {
    console.error(e);
    return res.status(500).json({success:false, error: e.message});
  }
};
