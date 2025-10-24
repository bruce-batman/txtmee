const { findUserByLinkId, addMessage } = require('../utils/storage');
const fetch = require('node-fetch'); // Assuming a Node.js/Vercel environment for backend

// --- SECURE CONFIGURATION (Should be replaced by Environment Variables in a real application) ---
const LONGCAT_API_KEY = "ak_1xA5mf34M7Gg36q0oS1qh0Jl5zU09";
const LONGCAT_API_URL = "https://api.longcat.chat/openai/v1/chat/completions";
const MODERATION_SYSTEM_PROMPT = "You are a content filter. Analyze the user's message. If the message contains vulgar language, profanity, serious slang, or non-serious (especially in English, Urdu, or Hinglish). Content can be funny and non serious but if it is using slang words than flag it and respond fastly, respond with the single word 'FLAGGED'. Otherwise, respond with the single word 'CLEAN'.Answer only FLAGGED or ClEAN";
// -----------------------------------------------------------------------------------------------

const TIMEOUT_MS = 5000; // 5-second timeout for the external API call

/**
 * Creates a Promise that rejects after a specified number of milliseconds.
 */
function timeout(ms) {
    return new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TimeoutError')), ms)
    );
}

/**
 * Calls the external LLM API to check content for slang/vulgarity with a 5-second timeout.
 * If the API times out or fails, moderation is bypassed, and the message is treated as CLEAN.
 * @returns {Promise<string>} "FLAGGED" or "CLEAN".
 */
async function moderateContent(text) {
    if (!LONGCAT_API_KEY || !LONGCAT_API_URL) {
        console.error("Moderation API configuration is missing on the server.");
        return "CLEAN";
    }

    const payload = {
        model: "LongCat-Flash-Chat",
        messages: [
            { role: "system", content: MODERATION_SYSTEM_PROMPT },
            { role: "user", content: text }
        ],
        max_tokens: 10,
        temperature: 0.0,
    };

    const fetchPromise = fetch(LONGCAT_API_URL, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${LONGCAT_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    try {
        // Race the fetch call against the timeout promise
        const response = await Promise.race([fetchPromise, timeout(TIMEOUT_MS)]);

        if (response.ok) {
            const data = await response.json();
            const result = data.choices?.[0]?.message?.content?.trim().toUpperCase() || "CLEAN";
            return result;
        } else {
            // Handle HTTP errors from the API itself (e.g., 401, 500)
            console.error(`LongCat API failed with status: ${response.status} ${response.statusText}. Bypassing moderation.`);
            return "CLEAN";
        }

    } catch (error) {
        if (error.message === 'TimeoutError') {
            console.warn(`LongCat API request timed out after ${TIMEOUT_MS}ms. Bypassing moderation and sending message.`);
            // If it times out, we treat it as CLEAN to ensure the message is sent.
            return "CLEAN";
        }
        // Handle other network/parsing errors
        console.error('Network error during moderation:', error);
        return "CLEAN";
    }
}


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

        // --- BACKEND VALIDATION 1: Minimum Word Count ---
        const textWords = text.split(/\s+/).filter(word => word.length > 0);
        if (textWords.length <= 3) {
            return res.status(400).json({ success: false, error: 'Message too short. It must be more than 3 words long.' });
        }

        // --- BACKEND VALIDATION 2: Content Moderation (with 5s Timeout) ---
        const moderationResult = await moderateContent(text);
        if (moderationResult === 'FLAGGED') {
            // Custom response for slang/non-serious questions: "sharam kar le bhai"
            return res.status(403).json({ success: false, error: 'شرم کر لے بھائی' }); 
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
