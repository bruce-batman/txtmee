const { addMessage, findUserByLinkId } = require('../utils/storage');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Use POST' });

  try {
    const { linkId } = req.query;
    const { askerName, question } = req.body;

    if (!linkId || !question)
      return res.status(400).json({ success: false, error: 'Link ID and question required' });

    // ✅ Fixed: await async findUser
    const user = await findUserByLinkId(linkId);
    if (!user)
      return res.status(404).json({ success: false, error: 'Invalid link' });

    const message = {
      messageId: Date.now().toString(),
      askerName: askerName || 'Anonymous',
      question,
      createdAt: new Date().toISOString()
    };

    // ✅ Save message
    await addMessage(linkId, message);

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully!',
      data: message
    });
  } catch (e) {
    console.error('Error sending message:', e);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
