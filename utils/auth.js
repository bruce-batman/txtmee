// utils/auth.js
const bcrypt = require('bcryptjs');

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
    // Log the error for debugging, but return null
    console.error("Error parsing Basic Auth header:", error);
    return null;
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  parseAuthHeader
};
