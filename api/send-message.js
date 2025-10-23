// api/sendmessages.js
const { findUserByLinkId, addMessage } = require('../utils/storage');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');

  if (req.method==='OPTIONS') return res.status(200).end();
  if (req.method!=='POST') return res.status(405).json({success:false, error:'Method Not Allowed. Use POST.'});

  try {
    const data = req.body;

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, error: 'Request body required' });
    }

    let { linkId, name, text } = data;
    
    // Clean up and validate input
    linkId = linkId ? String(linkId).trim() : null;
    text = text ? String(text).trim() : null;
    name = name ? String(name).trim() : 'Anonymous'; // Default name

    if (!linkId || !text) {
      return res.status(400).json({success:false, error:'linkId and text are required'});
    }

    const user = await findUserByLinkId(linkId);
    
    if (!user) {
      return res.status(404).json({success:false, error:'Link not found'});
    }
    
    const msg = await addMessage({linkId, name, text});
    
    // Use 201 Created status for successful resource creation
    return res.status(201).json({success:true, message: msg});

  } catch (e) {
    console.error('Error in sendmessages:', e);
    return res.status(500).json({success:false, error: 'Internal Server Error'});
  }
};
