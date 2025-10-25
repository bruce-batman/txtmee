const bcrypt = require('bcryptjs');

// --- ADMIN CONFIGURATION ---
// IMPORTANT: For production, this password should be hashed and stored securely.
const ADMIN_USERNAME = 'makki';
const ADMIN_PASSWORD = 'makkibatman';
// ---------------------------

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if passwords match
 */
async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

/**
 * Verify Basic Auth credentials from request header
 * @param {string} authHeader - Authorization header value
 * @returns {object|null} - Credentials object { username, password } or null
 */
function parseAuthHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return null;
    }

    try {
        const base64Credentials = authHeader.split(' ')[1];
        // Use Buffer.from(..., 'base64').toString('utf-8') for decoding
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [username, password] = credentials.split(':');

        return { username, password };
    } catch (error) {
        console.error("Error parsing Basic Auth header:", error);
        return null;
    }
}

/**
 * Checks if the provided credentials match the hardcoded admin credentials.
 * @param {string} username 
 * @param {string} password 
 * @returns {boolean}
 */
function checkAdminCredentials(username, password) {
    return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}


module.exports = {
    hashPassword,
    comparePassword,
    parseAuthHeader,
    checkAdminCredentials // <-- New export
};
