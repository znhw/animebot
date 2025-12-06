import React, { useState, useCallback } from 'react';
import TweetBox from './components/TweetBox'
import TweetPosts from './components/TweetPosts'
import './App.css';

function App() {
    // State now manages the full conversation history and loading status
    const [history, setHistory] = useState([]);
    const [userMessage, setUserMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // 1. Updates state every time the user types
    const handleInputChange = useCallback((event) => {
        setUserMessage(event.target.value);
    }, []);

    // 2. The function that handles user submission and API communication
    const sendMessage = useCallback(async (e) => {
        e.preventDefault(); 
        const userText = userMessage.trim();
        if (!userText) return;

        // --- A. Add User's Message to history and set loading ---
        const newUserMessage = {
            text: userText,
            key: Date.now() + 1,
            sender: 'user', 
        };
        
        // Update history, set loading, and clear input field
        setHistory(prevHistory => [...prevHistory, newUserMessage]);
        setLoading(true);
        setUserMessage(''); // Clear input immediately for better UX

        try {
            // Use relative path for Vercel deployment, or environment variable for local dev
            const apiUrl = process.env.REACT_APP_API_URL || '/api/chat';
            const response = await fetch(apiUrl, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userMessage: userText }),
            });

            if (!response.ok) {
                throw new Error('Backend failed to process the request.');
            }

            const data = await response.json();
            
            // --- B. Format and Add Bot's Response to history ---
            const newBotReply = {
                text: data.reply,
                character: data.character,
                show: data.show,
                key: Date.now() + 2, 
                sender: 'bot', 
            };

            // Add bot's reply and stop loading
            setHistory(prevHistory => [...prevHistory, newBotReply]);
            setLoading(false);

        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage = { 
                text: "API Error: Could not reach the server or process the request.", 
                sender: 'error', 
                key: Date.now() + 3 
            };
            setHistory(prevHistory => [...prevHistory, errorMessage]);
            setLoading(false);
        }
    }, [userMessage]); // Dependency on userMessage ensures the correct value is captured

    // --- RENDER ---
    return (
        <div className="wrapper">
            <h1>Start a conversation with characters from the anime world.</h1>
            <br />
            
            <div className="tweetposts">
                {/* Display the full conversation history */}
                <TweetPosts entries={history} />
            </div>

            {/* Loading Indicator */}
            {loading && (
                <div id="italic" className="loading-indicator">typing...</div> 
            )}

            {/* Input Component */}
            {/* Pass state and handlers as props */}
            <TweetBox 
                userMessage={userMessage}
                handleInputChange={handleInputChange}
                sendMessage={sendMessage}
                loading={loading}
            />
        </div>
    );
}

export default App;
