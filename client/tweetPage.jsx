const helper = require('./helper.js');
const React = require('react');
const { useState, useEffect } = React;
const { createRoot } = require('react-dom/client');


// Submit handler for tweets
const handleTweet = (e, onTweetAdded) => {
  e.preventDefault();
  helper.hideError();

  const content = e.target.querySelector('#tweetContent').value;

  if (!content) {
    helper.handleError('Tweet cannot be empty');
    return false;
  }

  helper.sendPost(e.target.action, { content }, () => {
    e.target.reset(); // clear textarea
    onTweetAdded();
  });

  return false;
};


// Tweet submission form
const TweetForm = (props) => {
  return (
    <form
      id="tweetForm"
      onSubmit={(e) => handleTweet(e, props.triggerReload)}
      name="tweetForm"
      action="/tweet"
      method="POST"
      style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px', backgroundColor: '#f0f8ff', padding: '10px', borderRadius: '8px' }}
    >
      <label htmlFor="content">What's happening?</label>
      <textarea id="tweetContent" name="content" maxLength="280" placeholder="Say something..." rows="4" />
      <input className="tweetSubmit" type="submit" value="Post" />
    </form>
  );
};



// Tweet feed/list
const TweetList = (props) => {
  const [tweets, setTweets] = useState(props.tweets);

  useEffect(() => {
    const loadTweetsFromServer = async () => {
      const response = await fetch('/getTweets');
      const data = await response.json();
      setTweets(data.tweets);
    };
    loadTweetsFromServer();
  }, [props.reloadTweets]);

  const deleteTweet = async (id) => {
    const response = await fetch(`/tweet/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (response.status === 200) {
      setTweets(tweets.filter((tweet) => tweet._id !== id));
    } else {
      alert(data.error);
    }
  };

  if (tweets.length === 0) {
    return (
      <div className="tweetList">
        <h3 className="emptyTweet">No tweets yet!</h3>
      </div>
    );
  }

  const tweetNodes = tweets.map(tweet => {
    const username = tweet.owner?.username || 'Unknown User';
    const profilePic = tweet.owner?.profilePic || '/assets/img/profile-placeholder.png';
    return (
      <div key={tweet._id} className="tweet" style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <img
            src={profilePic}
            alt={`${username}'s profile`}
            style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }}
          />
          <strong>{username}</strong>
        </div>
        <p>{tweet.content}</p>
        <small>{new Date(tweet.createdAt).toLocaleString()}</small><br />
        <button onClick={() => deleteTweet(tweet._id)}>Delete</button>
      </div>
    );
  });
  

  return (
    <div className="tweetList">
      {tweetNodes}
    </div>
  );
};

const Profile = () => {
  const [tweets, setTweets] = useState([]);
  const [user, setUser] = useState({ username: '', profilePic: '/assets/img/profile-placeholder.png' });

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/getMyTweets');
      const data = await response.json();
      if (data.tweets.length > 0) {
        const { username, profilePic } = data.tweets[0].owner;
        setUser({
          username,
          profilePic: profilePic || '/assets/img/profile-placeholder.png',
        });
      }
      setTweets(data.tweets);
    };

    fetchData();
  }, []);

  return (
    <div className="profilePage" style={{ maxWidth: '600px', margin: 'auto' }}>
      <h1>My Profile</h1>
      <div className="profileHeader" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <img
          src={user.profilePic}
          alt={`${user.username}'s profile`}
          style={{ width: '80px', height: '80px', borderRadius: '50%' }}
        />
        <h2>{user.username}</h2>
      </div>

      <div className="tweetList">
        <h3>My Tweets</h3> {/* Heading for the tweets section */}
        {tweets.length === 0 ? (
          <p>No tweets yet!</p>
        ) : (
          tweets.map((tweet) => (
            <div key={tweet._id} className="tweet" style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
              <p>{tweet.content}</p>
              <small>{new Date(tweet.createdAt).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};



// App wrapper
const App = () => {
  const [reloadTweets, setReloadTweets] = useState(false);

  return (
    <div>
      <div id="makeTweet">
        <TweetForm triggerReload={() => setReloadTweets(!reloadTweets)} />
      </div>
      <div id="tweets">
        <TweetList tweets={[]} reloadTweets={reloadTweets} />
      </div>
    </div>
  );
};

const init = () => {
  const root = createRoot(document.getElementById('app'));
  const path = window.location.pathname;

  if (path === '/timeline') {
    root.render(<App />);
  } else if (path === '/profile') {
    root.render(<Profile />);
  } else {
    root.render(<div>404 - Page Not Found</div>);
  }
};
window.onload = init;
