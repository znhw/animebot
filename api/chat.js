// Vercel serverless function for chat API
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
const Fuse = require('fuse.js');

// --- Configuration ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Module-level cache (persists across invocations in the same container)
let cachedQuotes = [];
let fuseSearchEngine = null;
const fuseOptions = {
    keys: ['text', 'character', 'anime'],
    includeScore: true,
    threshold: 0.4,
    limit: 10
};

// --- Core Data Fetching Function ---
async function fetchAndCacheQuotes() {
    try {
        const quoteApiUrl = 'https://yurippe.vercel.app/api/quotes';
        const response = await axios.get(quoteApiUrl);
        cachedQuotes = response.data;
        
        // Initialize Fuse.js Search Engine with the cached data
        fuseSearchEngine = new Fuse(cachedQuotes, fuseOptions);
        console.log(`✅ Successfully cached ${cachedQuotes.length} quotes and initialized search engine.`);
    } catch (error) {
        console.error("❌ CRITICAL ERROR: Failed to fetch and cache quotes.", error.message);
        throw new Error("Initialization failed due to external API error.");
    }
}

// Initialize quotes on first invocation (lazy loading)
let initializationPromise = null;
async function ensureInitialized() {
    if (!fuseSearchEngine) {
        if (!initializationPromise) {
            initializationPromise = fetchAndCacheQuotes();
        }
        await initializationPromise;
    }
}

// --- Vercel Serverless Function Handler ---
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Ensure quotes are loaded
        await ensureInitialized();

        // Check if the search engine is ready
        if (!fuseSearchEngine) {
            return res.status(503).json({ error: "Quote data is not available yet. Server is still initializing." });
        }

        const { userMessage } = req.body;

        if (!userMessage) {
            return res.status(400).json({ error: "userMessage is required" });
        }

        // 1. Pre-filter quotes using Fuse.js
        const searchResults = fuseSearchEngine.search(userMessage);
        const relevantQuotes = searchResults.map(result => result.item);

        // Fallback if search yields no results (use a random quote)
        if (relevantQuotes.length === 0) {
            const randomQuote = cachedQuotes[Math.floor(Math.random() * cachedQuotes.length)];
            relevantQuotes.push(randomQuote);
        }

        // --- Step A: LLM Selection Call ---
        const selectionPrompt = `
            Analyze the user's message: "${userMessage}".
            Your goal is to find the single most relevant quote from the following list to address the user's query.
            
            Quote List (JSON format):
            ${JSON.stringify(relevantQuotes)}
            
            1. Select the single quote object that is most appropriate.
            2. Respond ONLY with a clean JSON object containing the selected 'quote', 'character', and 'show'.
        `;

        const selectionResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: selectionPrompt,
        });

        // 2. Robust JSON Parsing
        const rawText = selectionResponse.text.trim();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);

        if (!jsonMatch || jsonMatch.length === 0) {
            console.error("LLM JSON Extraction Failed. Raw response:", rawText);
            return res.status(500).json({ error: "Internal Error: LLM failed to return valid JSON." });
        }

        const selectedQuoteData = JSON.parse(jsonMatch[0]);
        const { quote, character, show } = selectedQuoteData;

        // --- Step B: LLM Synthesis Call ---
        const synthesisPrompt = `
            You are role-playing as the character ${character} from the anime ${show}.
            The user said: "${userMessage}".
            
            Integrate the following quote: "${quote}" into a conversational, in-character response that directly addresses the user's message. Maintain the character's distinct voice and personality.
        `;

        const synthesisResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: synthesisPrompt,
        });

        const finalReply = synthesisResponse.text;

        // --- Step C: Send Final Success Response ---
        res.json({ reply: finalReply, character: character, show: show });

    } catch (error) {
        console.error("💥 CRITICAL ERROR during API processing:", error);
        return res.status(500).json({
            error: "Internal Server Error: Failed to generate response (LLM or network issue)."
        });
    }
};

