import React, { Component } from "react"
import '../App.css'

class TweetBox extends Component {

  render() {
        // The component now relies entirely on props:
        // 1. props.userMessage: The current value to display in the input.
        // 2. props.handleInputChange: The function to update the parent's state whenever the input changes.
        // 3. props.sendMessage: The function to run when the form is submitted.
        // 4. props.loading: The boolean to disable the input/button while waiting for the LLM.

        return(
            <div className="tweetbox">
                <form onSubmit={this.props.sendMessage}> 
                    <input 
                        placeholder="How are you feeling?"
                        // Controlled component: value is set by parent state
                        value={this.props.userMessage} 
                        // Handler is provided by parent
                        onChange={this.props.handleInputChange} 
                        disabled={this.props.loading}
                    />
                    <button 
                        type="submit" 
                        disabled={this.props.loading}
                    >
                        {this.props.loading ? 'Thinking...' : 'Send'}
                    </button>
                </form>
            </div>
        )
    }
}

export default TweetBox;
