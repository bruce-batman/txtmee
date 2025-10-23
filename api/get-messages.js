// api/getmessages.js
const { findUserByLinkId, getMessages } = require('../utils/storage');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');

  if (req.method==='OPTIONS') return res.status(200).end();
  if (req.method!=='GET') return res.status(405).json({success:false, error:'Method Not Allowed. Use GET.'});

  try {
    const { linkId } = req.query; // Query params are generally safe
    
    if (!linkId) {
      return res.status(400).json({success:false, error:'linkId query parameter is required'});
    }
    
    const user = await findUserByLinkId(linkId);
    
    if (!user) {
      return res.status(404).json({success:false, error:'Link not found'});
    }
    
    // Note: Ensure only authenticated users can view messages if they are private.
    const messages = await getMessages(linkId);
    
    return res.json({success:true, messages});
  } catch (e) {
    console.error('Error in getmessages:', e);
    return res.status(500).json({success:false, error: 'Internal Server Error'});
  }
};
