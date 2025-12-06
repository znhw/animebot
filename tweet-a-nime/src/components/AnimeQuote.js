import React, { Component } from "react";
import '../App.css'
import TweetBox from './TweetBox'; // Ensure the path is correct
import TweetPosts from './TweetPosts'; // Your history display component

class AnimeQuote extends Component {

    state = {
        userMessage: '',
        botReply: null,
        loading: false,
        // The history of all messages (user and bot)
        history: [],
        
    }

   handleInputChange = (event) => {
        this.setState({ userMessage: event.target.value });
    };
    
    sendMessage = async (e) => {
        e.preventDefault();
        const userText = this.state.userMessage.trim();
        if (!userText) return;

        // 1. Add User's Message to history
        const newUserMessage = {
            text: userText,
            key: Date.now() + 1,
            sender: 'user', 
        };

        this.setState(prevState => ({
            history: [...prevState.history, newUserMessage],
            loading: true,
            userMessage: '', // Clear the input field immediately
        }));        
        try {
            // Use relative path for Vercel deployment, or environment variable for local dev
            const apiUrl = process.env.REACT_APP_API_URL || '/api/chat';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userMessage: userText }),
            });

            if (!response.ok) {
                throw new Error('Backend failed to process the request.');
            }

            const data = await response.json();

            // 2. Format and Add Bot's Response to history
            const newBotReply = {
                text: data.reply,
                character: data.character,
                anime: data.anime,
                key: Date.now() + 2, 
                sender: 'bot', 
            };

            this.setState(prevState => ({
                history: [...prevState.history, newBotReply],
                loading: false,
            }));
        } catch (error) {
            console.error("Error sending message:", error);
            this.setState( prevState => ({ 
                history: [...prevState.history, { text: "API Error: Could not reach the server.", sender: 'error', key: Date.now() + 3 }],
                loading: false 
            })) ;
        }
    };
    
    render() {
    // Determine the data source for clarity
    // const replyData = this.state.botReply; 

    return (
        // The main container for the chatbot output
        <div className="reply">

            <TweetPosts entries={this.state.history} />
            {this.state.loading && (
                    <div id="italic" className="loading-indicator">typing...</div> 
            )}
            
            1. Show Loading State
            {this.state.loading && (
                <div id="italic">typing...</div> 
            )}

            

           <TweetBox 
                    // Pass the state values and handler functions as props
                    userMessage={this.state.userMessage}
                    handleInputChange={this.handleInputChange}
                    sendMessage={this.sendMessage}
                    loading={this.state.loading}
            />
        </div>
    );
    }
}

export default AnimeQuote;