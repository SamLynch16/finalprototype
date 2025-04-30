const helper = require('./helper.js');
const React = require('react');
const { useState, useEffect} = React;
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

// TweetList for displaying and interacting with tweets
const TweetList = (props) => {
  const [tweets, setTweets] = useState(props.tweets);
  const [currentUsername, setCurrentUsername] = useState('');
  const [commentContents, setCommentContents] = useState({});
  const [replyContents, setReplyContents] = useState({});

  // Fetch tweets and current user when the component mounts or reloads
  useEffect(() => {
    const loadTweetsFromServer = async () => {
      const response = await fetch('/getTweets');
      const data = await response.json();
      setTweets(data.tweets);
    };

    const fetchCurrentUser = async () => {
      const response = await fetch('/profile');
      const data = await response.json();
      if (data.username) {
        setCurrentUsername(data.username);
      }
    };

    loadTweetsFromServer();
    fetchCurrentUser();
  }, [props.reloadTweets]);

  //handles liking a tweet
  const handleLike = async (tweetId) => {
    const response = await fetch(`/like/${tweetId}`, { method: 'POST' });
    const data = await response.json();

    if (response.status === 200) {
      setTweets(tweets.map(tweet => {
        if (tweet._id === tweetId) {
          const updatedLikes = Array.isArray(tweet.likes) ? [...tweet.likes, currentUsername] : [currentUsername];
          return { ...tweet, likes: updatedLikes };
        }
        return tweet;
      }));
    } else {
      helper.handleError(data.error);
    }
  };

  //handles unliking a tweet
  const handleUnlike = async (tweetId) => {
    const response = await fetch(`/unlike/${tweetId}`, { method: 'POST' });
    const data = await response.json();

    if (response.status === 200) {
      setTweets(tweets.map(tweet => {
        if (tweet._id === tweetId) {
          const updatedLikes = Array.isArray(tweet.likes) ? tweet.likes.filter(username => username !== currentUsername) : [];
          return { ...tweet, likes: updatedLikes };
        }
        return tweet;
      }));
    } else {
      helper.handleError(data.error);
    }
  };

  //handles deleting a tweet
  const handleDelete = async (tweetId) => {
    try {
      const response = await fetch(`/tweet/${tweetId}`, { method: 'DELETE' });

      if (!response.ok) {
        helper.handleError('Failed to delete tweet');
        return;
      }

      const data = await response.json();
      console.log(data.message);

      setTweets(tweets.filter(tweet => tweet._id !== tweetId));
    } catch (error) {
      helper.handleError('Error deleting tweet: ' + error.message);
    }
  };


  //handles comment input change
  const handleCommentInputChange = (tweetId, content) => {
    setCommentContents(prevState => ({
      ...prevState,
      [tweetId]: content,
    }));
  };

  //handles comment submission
  const handleCommentSubmit = async (tweetId, content) => {
    if (!content) return;
    const response = await fetch(`/tweets/${tweetId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (response.ok) {
      const data = await response.json();
      setTweets(tweets.map(tweet => {
        if (tweet._id === tweetId) {
          const updatedComments = Array.isArray(tweet.comments) ? [...tweet.comments, data.comment] : [data.comment];
          return { ...tweet, comments: updatedComments };
        }
        return tweet;
      }));
      setCommentContents(prevState => ({
        ...prevState,
        [tweetId]: '',
      }));
    } else {
      helper.handleError('Error adding comment');
      return;
    }
  };

  //handles for deleting a comment
  const handleDeleteComment = async (tweetId, commentId) => {
    try {
      const response = await fetch(`/tweets/${tweetId}/comments/${commentId}`, { method: 'DELETE' });

      if (!response.ok) {
        helper.handleError('Failed to delete comment');
        return;
      }

      const data = await response.json();

      setTweets(tweets.map(tweet => {
        if (tweet._id === tweetId) {
          const updatedComments = tweet.comments.filter(comment => comment._id.toString() !== commentId.toString());
          return { ...tweet, comments: updatedComments };
        }
        return tweet;
      }));

    } catch (error) {
      helper.handleError('Error deleting comment' + error.message);
    }
  };

  //handles the reply input change
  const handleReplyInputChange = (tweetId, commentId, content) => {
    setReplyContents(prevState => ({
      ...prevState,
      [`${tweetId}-${commentId}`]: content,
    }));
  };

  //handles reply submission
  const handleReplySubmit = async (tweetId, commentId, replyContent) => {
    if (!replyContent) return;

    // Send the reply content to the backend
    const response = await fetch(`/tweets/${tweetId}/comments/${commentId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyContent }),
    });


    if (response.ok) {
      const data = await response.json();

      setTweets(tweets.map(tweet => {
        if (tweet._id === tweetId) {
          const updatedComments = tweet.comments.map(comment => {
            if (comment._id === commentId) {
              // Ensure replies is always an array before updating
              const updatedReplies = Array.isArray(comment.replies) ? [...comment.replies, data.reply] : [data.reply];
              return { ...comment, replies: updatedReplies };
            }
            return comment;
          });
          return { ...tweet, comments: updatedComments };
        }
        return tweet;
      }));

      // Clear the reply input field
      setReplyContents(prev => ({ ...prev, [`${tweetId}-${commentId}`]: '' }));
    } else {
      helper.handleError('Error replying to comment');
    }
  };

  //handles deleting a reply
  const handleDeleteReply = async (tweetId, commentId, replyId) => {
    try {
      const response = await fetch(`/tweets/${tweetId}/comments/${commentId}/replies/${replyId}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to delete reply:', errorData.error);
        return;
      }
  
      // Update the UI by removing the deleted reply from the state
      setTweets(tweets.map(tweet => {
        if (tweet._id === tweetId) {
          const updatedComments = tweet.comments.map(comment => {
            if (comment._id === commentId) {
              const updatedReplies = comment.replies.filter(reply => reply._id !== replyId);
              return { ...comment, replies: updatedReplies };
            }
            return comment;
          });
          return { ...tweet, comments: updatedComments };
        }
        return tweet;
      }));
  
      console.log('Reply deleted successfully');
    } catch (err) {
      console.error('Error during reply deletion:', err);
      helper.handleError('Error deleting reply');
    }
  };
  
  const tweetNodes = tweets.map(tweet => {
    const username = tweet.owner?.username || 'Unknown User';
    const profilePic = tweet.owner?.profilePic || '/assets/img/profile-placeholder.png';
    const tweetLikes = Array.isArray(tweet.likes) ? tweet.likes : [];
    const tweetComments = Array.isArray(tweet.comments) ? tweet.comments : [];
    const commentContent = commentContents[tweet._id] || '';
  
    return (
      <div key={tweet._id} className="tweet" style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '6px' }}>
        {/* Tweet header */}
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
  
        {/* Tweet actions */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => handleLike(tweet._id)} style={{ marginRight: '10px' }}>Like</button>
          <button onClick={() => handleUnlike(tweet._id)} style={{ marginRight: '10px' }}>Unlike</button>
          <span>{tweetLikes.length} Likes</span>
          <button onClick={() => handleDelete(tweet._id)} style={{ marginLeft: '10px', color: 'red' }}>Delete</button>
        </div>
  
        {/* Comments Section */}
        <div style={{ marginTop: '10px' }}>
          {/* New comment input */}
          <textarea
            value={commentContent}
            onChange={e => handleCommentInputChange(tweet._id, e.target.value)}
            placeholder="Add a comment"
            rows="3"
            style={{ width: '100%', padding: '5px', marginBottom: '10px' }}
          />
          <button onClick={() => handleCommentSubmit(tweet._id, commentContent)} style={{ marginBottom: '15px' }}>
            Post Comment
          </button>
  
          <h4>Comments:</h4>
          {tweetComments.length === 0 ? (
            <p>No comments yet.</p>
          ) : tweetComments.map(comment => (
            <div key={comment._id} style={{ border: '1px solid #ddd', marginBottom: '8px', padding: '5px' }}>
              {/* Comment header */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <strong>{comment.username}</strong>
              </div>
              <p>{comment.content}</p>
              <small>{new Date(comment.createdAt).toLocaleString()}</small><br />
  
              {/* Comment actions */}
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                <button onClick={() => handleDeleteComment(tweet._id, comment._id)} style={{ color: 'red' }}>Delete Comment</button>
                <button
                  onClick={() => setReplyContents(prev => ({
                    ...prev,
                    [`${tweet._id}-${comment._id}`]: prev[`${tweet._id}-${comment._id}`] || ''
                  }))}
                  style={{ marginLeft: '10px' }}
                >
                  Reply
                </button>
              </div>
  
              {/* Reply input */}
              {replyContents.hasOwnProperty(`${tweet._id}-${comment._id}`) && (
                <div style={{ marginLeft: '20px', marginTop: '5px' }}>
                  <textarea
                    value={replyContents[`${tweet._id}-${comment._id}`]}
                    onChange={e => handleReplyInputChange(tweet._id, comment._id, e.target.value)}
                    placeholder="Write a reply..."
                    rows="2"
                    style={{ width: '90%', padding: '5px' }}
                  />
                  <button
                    onClick={() => handleReplySubmit(tweet._id, comment._id, replyContents[`${tweet._id}-${comment._id}`])}
                    style={{ marginTop: '5px' }}
                  >
                    Post Reply
                  </button>
                </div>
              )}
  
              {/* Replies */}
              {Array.isArray(comment.replies) && comment.replies.map(reply => (
                <div key={reply._id} style={{ marginLeft: '30px', marginTop: '5px', padding: '5px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
                  <strong>{reply.username}</strong>
                  <p>{reply.content}</p>
                  <small>{new Date(reply.createdAt).toLocaleString()}</small><br />
                  <button
                    onClick={() => handleDeleteReply(tweet._id, comment._id, reply._id)}
                    style={{ marginTop: '5px', backgroundColor: '#f44336', color: 'white' }}
                  >
                    Delete Reply
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
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
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

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
        setNewUsername(username);
      }
      setTweets(data.tweets);
    };

    fetchData();
  }, []);

  const handleUsernameUpdate = async () => {
    const response = await fetch('/updateUsername', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername }),
    });

    if (response.ok) {
      setUser((prev) => ({ ...prev, username: newUsername }));
      setIsEditing(false);
    } else {
      ('Failed to update username');
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmNewPassword) {
      helper.handleError("New passwords don't match!");
      return;
    }

    const response = await fetch('/updatePassword', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (response.ok) {
      helper.handleError('Password updated successfully');
      setIsChangingPassword(false);
    } else {
      helper.handleError('Failed to update password');
    }
  };

  return (
    <div className="profilePage" style={{ maxWidth: '600px', margin: 'auto' }}>
      <h1>My Profile</h1>

      {/* Ad Banner */}
      <div className="ad-banner" style={{ width: '100%', backgroundColor: '#f5a623', color: 'white', textAlign: 'center', padding: '10px 0', fontSize: '16px', marginBottom: '20px' }}>
        <p>Check out our amazing offers!</p>
        <img src="https://via.placeholder.com/600x150" alt="Ad Banner" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
      </div>

      <div className="profileHeader" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <img
          src={user.profilePic}
          alt={`${user.username}'s profile`}
          style={{ width: '80px', height: '80px', borderRadius: '50%' }}
        />
        <div>
          {isEditing ? (
            <>
              <input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                style={{ marginRight: '0.5rem' }}
              />
              <button onClick={handleUsernameUpdate}>Save</button>
            </>
          ) : (
            <h2>
              {user.username}
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  marginLeft: '0.5rem',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
                title="Edit username"
              >
                ✏️
              </button>
            </h2>
          )}
        </div>
      </div>

      <div>
        {isChangingPassword ? (
          <div>
            <h3>Change Password</h3>
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
            <button onClick={handlePasswordChange}>Save Password</button>
            <button onClick={() => setIsChangingPassword(false)}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setIsChangingPassword(true)}>Change Password</button>
        )}
      </div>

      <div className="tweetList">
        <h3>My Tweets</h3>
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

// Initialize app
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