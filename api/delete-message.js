// api/dltmessage.js 
const { deleteMessage } = require('../utils/storage');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS,DELETE'); // Added DELETE method, though POST is used below
  res.setHeader('Access-Control-Allow-Headers','Content-Type');

  if (req.method==='OPTIONS') return res.status(200).end();
  if (req.method!=='POST') return res.status(405).json({success:false, error:'Method Not Allowed. Use POST.'});

  try {
    const data = req.body;

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, error: 'Request body required' });
    }

    const { linkId, messageId } = data;
    
    if (!linkId || !messageId) {
      return res.status(400).json({success:false, error:'linkId and messageId are required'});
    }

    // Note: Authentication/Authorization should ideally happen here 
    // (e.g., checking if the user performing the delete owns the linkId)

    const ok = await deleteMessage(linkId, messageId);
    
    if (!ok) {
      return res.status(404).json({success:false, error:'Message not found or linkId/messageId mismatch'});
    }

    return res.json({success:true, message: 'Message deleted successfully'});
  } catch (e) {
    console.error('Error in dltmessage:', e);
    return res.status(500).json({success:false, error: 'Internal Server Error'});
  }
};
