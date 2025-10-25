const { findUserByLinkId, getMessages, findUserByUsername } = require('../utils/storage');
const { parseAuthHeader, comparePassword } = require('../utils/auth');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed. Use GET.' });

    try {
        // We use the linkId from the query primarily to identify the target inbox
        const queryLinkId = req.query.linkId;

        if (!queryLinkId) {
            return res.status(400).json({ success: false, error: 'linkId query parameter is required' });
        }

        // --- START: Authorization Check ---
        const authHeader = req.headers.authorization;
        const credentials = parseAuthHeader(authHeader);

        let authenticatedUser = null;
        let finalLinkId = null;

        if (credentials) {
            const { username, password } = credentials;
            const dbUser = await findUserByUsername(username);

            if (dbUser) {
                // CRITICAL STEP: Compare the provided password with the stored hash
                const isPasswordValid = await comparePassword(password, dbUser.password);
                
                if (isPasswordValid) {
                    authenticatedUser = dbUser;
                    // Use the authenticated user's actual linkId for data retrieval and response
                    finalLinkId = dbUser.linkId;
                }
            }
        }

        if (!authenticatedUser) {
            // Respond with 401 Unauthorized and prompt for Basic Auth credentials
            res.setHeader('WWW-Authenticate', 'Basic realm="Access Messages"');
            return res.status(401).json({ success: false, error: 'Authorization required to view messages' });
        }
        // --- END: Authorization Check ---

        // 3. If authenticated, fetch messages for the *authenticated user's* linkId
        const messages = await getMessages(finalLinkId);

        // Return the final linkId in the response so the client can save the correct one
        // (This is crucial if the client sent a dummy 'temp' linkId initially)
        return res.json({ success: true, linkId: finalLinkId, messages });

    } catch (e) {
        console.error('Error in getmessages:', e);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
