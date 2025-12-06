import React, { Component } from "react";
import AnimeQuote from "./AnimeQuote";


class TweetPosts extends Component {
    render() {
        return (
            <ul className="tweetList">
                {this.props.entries.map(entry => <TweetPost text={entry.text}
                    key={entry.key}
                />).reverse()}
            </ul>
        )
    }
};

const TweetPost = (props) => {
    return (
        <>
            <AnimeQuote/>
            <div>
                <span id="italic">you @tweet anime world</span>
                <p className="tweet">
                {props.text}
                </p>

            </div>
        </>
    )
}

export default TweetPosts;