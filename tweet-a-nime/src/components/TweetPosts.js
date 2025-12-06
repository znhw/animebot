import React, { Component } from "react";
// import AnimeQuote from "./AnimeQuote";

// Ensure your TweetPosts and ChatMessage logic is set up to handle 'sender'
const ChatMessage = (props) => {
    // BOT MESSAGE
    if (props.sender === 'bot') {
        return (
            <div className="bot-reply">
                <div className="reply-header">
                    <span id="italic">{props.character} @{props.show}</span>
                </div>
                <div className="reply-message">{props.text}</div>
            </div>
        );
    }
    
    // USER MESSAGE
    return (
        <div className="user-message">
            <span id="italic">you @tweet anime world</span>
            <p className="tweet">
                {props.text}
            </p>
        </div>
    );
}

class TweetPosts extends Component {
    render() {
        return (
            <ul className="tweetList">
                {this.props.entries.map(entry => (
                    <li key={entry.key} className={entry.sender}>
                        <ChatMessage 
                            text={entry.text}
                            sender={entry.sender}
                            character={entry.character}
                            show={entry.show}
                        />
                    </li>
                ))}
            </ul>
        )
    }
};

export default TweetPosts;