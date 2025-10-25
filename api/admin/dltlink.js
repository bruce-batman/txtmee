const { checkAdminCredentials, parseAuthHeader } = require('../../utils/auth');
const { deleteUserAndMessages } = require('../../utils/storage');

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

        const { linkId } = data;
        if (!linkId) {
            return res.status(400).json({ success: false, error: 'linkId is required in the body' });
        }

        // --- Authorization Check ---
        const authHeader = req.headers.authorization;
        const credentials = parseAuthHeader(authHeader);

        if (!credentials || !checkAdminCredentials(credentials.username, credentials.password)) {
            res.setHeader('WWW-Authenticate', 'Basic realm="Admin Access"');
            return res.status(401).json({ success: false, error: 'Admin Authorization required' });
        }

        // --- ADMIN AUTHORIZED: Delete the user and all their messages ---
        const deletedCount = await deleteUserAndMessages(linkId);

        return res.json({ 
            success: true, 
            message: `Link ${linkId} and ${deletedCount} associated messages deleted successfully.` 
        });

    } catch (e) {
        console.error('Error in admin/dltlink:', e);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
