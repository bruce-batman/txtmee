const { checkAdminCredentials, parseAuthHeader } = require('../utils/auth');
// Assuming the user implements this in utils/storage.js
const { getAllUsersWithMessages } = require('../utils/storage'); 
// NOTE: I am assuming `getAllUsersWithMessages` exists in storage.js for this to function.

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed. Use GET.' });

    try {
        const authHeader = req.headers.authorization;
        const credentials = parseAuthHeader(authHeader);

        if (!credentials || !checkAdminCredentials(credentials.username, credentials.password)) {
            res.setHeader('WWW-Authenticate', 'Basic realm="Admin Access"');
            return res.status(401).json({ success: false, error: 'Admin Authorization required' });
        }
        
        // --- ADMIN AUTHORIZED ---
        // Fetch all data assuming getAllUsersWithMessages exists in storage.js
        const data = await getAllUsersWithMessages(); 

        return res.json({ success: true, data });

    } catch (e) {
        console.error('Error in admin/getdata:', e);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
