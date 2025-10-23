
const { findUserByLinkId, getMessages } = require('../utils/storage');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');

  if (req.method==='OPTIONS') return res.status(200).end();
  if (req.method!=='GET') return res.status(405).json({success:false, error:'Use GET'});

  try {
    const { linkId } = req.query || {};
    if (!linkId) return res.status(400).json({success:false, error:'linkId required'});
    const user = await findUserByLinkId(linkId);
    if (!user) return res.status(404).json({success:false, error:'link not found'});
    const messages = await getMessages(linkId);
    return res.json({success:true, messages});
  } catch (e) {
    console.error(e);
    return res.status(500).json({success:false, error: e.message});
  }
};
