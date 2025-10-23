
const { findUserByLinkId, deleteMessage } = require('../utils/storage');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');

  if (req.method==='OPTIONS') return res.status(200).end();
  if (req.method!=='POST') return res.status(405).json({success:false, error:'Use POST'});

  try {
    const { linkId, messageId } = req.body || {};
    if (!linkId || !messageId) return res.status(400).json({success:false, error:'linkId and messageId required'});
    const ok = await deleteMessage(linkId, messageId);
    if (!ok) return res.status(404).json({success:false, error:'message not found'});
    return res.json({success:true});
  } catch (e) {
    console.error(e);
    return res.status(500).json({success:false, error: e.message});
  }
};
