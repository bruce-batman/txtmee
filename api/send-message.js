const { v4: uuidv4 } = require('uuid');
const { findUserByLinkId, addMessage } = require('../utils/storage');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { linkId } = req.query;
    const { askerName, question } = req.body;

    // Validate linkId
    if (!linkId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Link ID is required' 
      });
    }

    // Validate question (required)
    if (!question || question.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Question is required' 
      });
    }

    // Check if user exists
    const user = findUserByLinkId(linkId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invalid link. User not found.' 
      });
    }

    // Create message object
    const message = {
      messageId: uuidv4(),
      linkId,
      askerName: askerName && askerName.trim() !== '' ? askerName.trim() : 'Anonymous',
      question: question.trim(),
      createdAt: new Date().toISOString()
    };

    // Save message
    addMessage(message);

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully!',
      data: {
        messageId: message.messageId,
        sentTo: user.username
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};
