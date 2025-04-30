/* eslint-disable max-len */
/* eslint-disable prefer-destructuring */
const { Tweet } = require('../models');
const { Comment, Reply } = require('../models/comment');

// Assuming you have a Tweet model in models

// Controller for creating a tweet
const createTweet = async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required for the tweet!' });
  }

  const tweetData = {
    content,
    owner: req.session.account._id, // Assume `account` stores the logged-in user's data
    timestamp: new Date(),
  };

  try {
    const newTweet = new Tweet(tweetData);
    await newTweet.save();
    return res.status(201).json({ tweet: newTweet });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: `Error creating tweet: ${err.message}` });
  }
};

const timeline = async (req, res) => {
  try {
    // Find all tweets from the database
    const tweets = await Tweet.find().lean().exec(); // Fetch all tweets

    if (tweets.length === 0) {
      return res.render('app', { message: 'No tweets available.' }); // Render app.handlebars with a message
    }

    // If tweets exist, render the timeline
    return res.render('app');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// Get ALL tweets (for the public timeline)
const getTweets = async (req, res) => {
  try {
    const tweets = await Tweet.find()
      .sort({ createdAt: -1 })
      .populate('owner', 'username profilePic')
      .populate({
        path: 'comments',
        select: 'username content createdAt replies',
        populate: {
          path: 'replies',
          model: 'Reply',
          select: 'username content createdAt',
        },
      })
      .lean()
      .exec();

    return res.json({ tweets });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: `Error retrieving tweets: ${err.message}` });
  }
};

// Controller for deleting a tweet
const deleteTweet = async (req, res) => {
  const { id } = req.params; // Get the tweet ID from the URL parameters

  try {
    // Ensure the logged-in user owns the tweet they are trying to delete
    const tweet = await Tweet.findOneAndDelete({
      _id: id,
      owner: req.session.account._id, // Only allow deletion by the owner
    });

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found or you do not own it!' });
    }

    return res.status(200).json({ message: 'Tweet deleted successfully!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: `An error occurred while deleting the tweet: ${err.message}` });
  }
};

const getMyTweets = async (req, res) => {
  if (!req.session.account) {
    return res.status(403).json({ error: 'User not authenticated' });
  }

  try {
    const account = req.session.account;

    const tweets = await Tweet.find({ owner: account._id })
      .sort({ createdAt: -1 })
      .populate('owner', 'username profilePic'); // Populate with just username & profilePic

    return res.json({ tweets });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error fetching tweets' });
  }
};

const likeTweet = async (req, res) => {
  const { id } = req.params;
  const userId = req.session.account._id; // Get the logged-in user's ID

  try {
    // Find the tweet by its ID
    const tweet = await Tweet.findById(id);

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found!' });
    }

    // Check if the user has already liked the tweet
    if (tweet.likes.includes(userId)) {
      return res.status(400).json({ error: 'You have already liked this tweet!' });
    }

    // Add the user's ID to the likes array
    tweet.likes.push(userId);
    await tweet.save();

    return res.status(200).json({ message: 'Tweet liked!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'An error occurred while liking the tweet!' });
  }
};

const unlikeTweet = async (req, res) => {
  const { id } = req.params;
  const userId = req.session.account._id; // Get the logged-in user's ID

  try {
    // Find the tweet by its ID
    const tweet = await Tweet.findById(id);

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found!' });
    }

    // Remove the user's ID from the likes array
    tweet.likes = tweet.likes.filter((user) => user.toString() !== userId.toString());
    await tweet.save();

    return res.status(200).json({ message: 'Tweet unliked!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'An error occurred while unliking the tweet!' });
  }
};

// Add a comment to a tweet
const addComment = async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  const { username, _id } = req.session.account; // Get the owner's _id from the session

  try {
    // Find the tweet by ID
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    // Create a new comment object with the owner field set
    const newComment = new Comment({
      tweetId,
      username,
      content,
      owner: _id, // Set the owner to the user's _id
      createdAt: new Date(),
    });

    // Save the new comment
    await newComment.save();

    // Ensure the comments array exists before pushing to it
    if (!tweet.comments) {
      tweet.comments = [];
    }

    // Add the comment's ID to the tweet's comments array
    tweet.comments.push(newComment._id);
    await tweet.save();

    // Return success response
    return res.status(200).json({ message: 'Comment added successfully', comment: newComment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to add comment' });
  }
};

// Get all comments for a specific tweet
const getComments = async (req, res) => {
  const { tweetId } = req.params;

  try {
    // Fetch the comments for the tweet
    const comments = await Comment.find({ tweetId })
      .populate({
        path: 'replies', // Populate replies for each comment
        model: 'Reply', // Reference to the 'Reply' model
      })
      .exec();

    return res.status(200).json({ comments });
  } catch (err) {
    console.error('Error fetching comments:', err);
    return res.status(500).json({ error: 'Error fetching comments' });
  }
};

const deleteComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // check if owner exists and matches session user
    if (!comment.owner || !comment.owner.equals(req.session.account._id)) {
      console.log('Comment owner:', comment.owner);
      console.log('Session user:', req.session.account._id);
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    await comment.deleteOne();

    return res.status(200).json({ message: 'Comment deleted successfully!' });
  } catch (err) {
    console.error('Error in deleteComment:', err);
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
};

const replyToComment = async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  try {
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) return res.status(404).json({ error: 'Parent comment not found' });

    const newReply = new Reply({
      content,
      username: req.session.account.username,
      owner: req.session.account._id,
    });

    await newReply.save();

    parentComment.replies.push(newReply._id);
    await parentComment.save();

    return res.status(200).json({ message: 'Reply added', reply: newReply });
  } catch (err) {
    console.error('Error replying to comment:', err);
    return res.status(500).json({ error: 'Server error while replying' });
  }
};

const deleteReply = async (req, res) => {
  const { tweetId, commentId, replyId } = req.params;
  const userId = req.session.account._id;

  try {
    // Find the tweet to validate its existence
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) return res.status(404).json({ error: 'Tweet not found' });

    // Find the comment to validate its existence
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // Find the reply to validate its existence
    const reply = await Reply.findById(replyId);
    if (!reply) return res.status(404).json({ error: 'Reply not found' });

    // Ensure the reply belongs to the correct comment
    if (!comment.replies.includes(replyId)) {
      return res.status(400).json({ error: 'Reply does not belong to this comment' });
    }

    // Ensure the reply belongs to the correct tweet
    if (!tweet.comments.includes(commentId)) {
      return res.status(400).json({ error: 'Comment does not belong to this tweet' });
    }

    // Check if the logged-in user is the owner of the reply
    if (!reply.owner.equals(userId)) {
      return res.status(403).json({ error: 'Not authorized to delete this reply' });
    }

    // Delete the reply
    await reply.deleteOne();

    // Remove the reply reference from the comment
    await Comment.updateOne({ _id: comment._id }, { $pull: { replies: replyId } });

    // Optionally, update the tweet if necessary (for example, if tweet stats need to change)
    // await Tweet.updateOne({ _id: tweet._id }, { $pull: { comments: commentId } });

    return res.json({ message: 'Reply deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createTweet,
  getTweets,
  deleteTweet,
  timeline,
  getMyTweets,
  likeTweet,
  unlikeTweet,
  addComment,
  getComments,
  deleteComment,
  replyToComment,
  deleteReply,
};
