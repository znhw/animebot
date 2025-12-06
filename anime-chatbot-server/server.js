// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const Fuse = require('fuse.js');

// --- Configuration and Initialization ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const app = express();
const PORT = 3001;

// Global state variables
let cachedQuotes = [];
let fuseSearchEngine = null; 
const fuseOptions = {
    keys: ['text', 'character', 'anime'],
    includeScore: true,
    threshold: 0.4,
    limit: 10
};

// Middleware
app.use(cors()); 
app.use(express.json());

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
        // This will block the server from starting if critical data fails to load
        console.error("❌ CRITICAL ERROR: Failed to fetch and cache quotes.", error.message);
        throw new Error("Initialization failed due to external API error.");
    }
}

// --- API Endpoint ---
app.post('/api/chat', async (req, res) => {
    
    // Check if the search engine is ready
    if (!fuseSearchEngine) { 
        return res.status(503).json({ error: "Quote data is not available yet. Server is still initializing." });
    }

    // --- START OF TOP-LEVEL TRY BLOCK to catch all errors ---
    try { 
        const { userMessage } = req.body;
        
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
            // Log the problematic response and fail gracefully
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
        // --- CATCH ALL: Log the error and return a generic failure ---
        console.error("💥 CRITICAL ERROR during API processing:", error);
        return res.status(500).json({ 
            error: "Internal Server Error: Failed to generate response (LLM or network issue)." 
        });
    }
});

// --- Server Startup Logic: WAIT for data before listening ---
async function startServer() {
    try {
        await fetchAndCacheQuotes(); // WAIT for the quotes and search engine to initialize
        
        // Only start listening for requests AFTER the data is ready
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log("Chatbot ready to receive messages.");
        });
    } catch (e) {
        console.error("FATAL ERROR: Server failed to start due to initialization failure.");
        process.exit(1); // Exit the process if initialization fails
    }
}

startServer();