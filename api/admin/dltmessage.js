const { checkAdminCredentials, parseAuthHeader } = require('../utils/auth');
const { deleteMessage } = require('../utils/storage');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });

    try {
        // --- Manual Body Parsing ---
        let body = '';
        await new Promise((resolve, reject) => {
          req.on('data', chunk => (body += chunk));
          req.on('end', resolve);
          req.on('error', reject);
        });
        
        let data;
        try {
          data = JSON.parse(body);
        } catch (e) {
          return res.status(400).json({ success: false, error: 'Invalid JSON body' });
        }

        const { linkId, messageId } = data;
        if (!linkId || !messageId) {
            return res.status(400).json({ success: false, error: 'linkId and messageId are required' });
        }

        // --- Authorization Check ---
        const authHeader = req.headers.authorization;
        const credentials = parseAuthHeader(authHeader);

        if (!credentials || !checkAdminCredentials(credentials.username, credentials.password)) {
            res.setHeader('WWW-Authenticate', 'Basic realm="Admin Access"');
            return res.status(401).json({ success: false, error: 'Admin Authorization required' });
        }

        // --- ADMIN AUTHORIZED: Delete the message ---
        const ok = await deleteMessage(linkId, messageId);

        if (!ok) {
            return res.status(404).json({ success: false, error: 'Message not found or already deleted' });
        }

        return res.json({ success: true, message: 'Message deleted successfully' });

    } catch (e) {
        console.error('Error in admin/dltmessage:', e);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
