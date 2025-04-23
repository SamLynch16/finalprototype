/* eslint-disable prefer-destructuring */
const { Tweet } = require('../models'); // Assuming you have a Tweet model in models

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
      .populate('owner', 'username profilePic') // only fetch username and profilePic
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
    const account = req.session.account; // Get the logged-in user's account from the session

    // Fetch the user's tweets from the database, sorted by the creation date in descending order
    const tweets = await Tweet.find({ owner: account._id })
      .sort({ createdAt: -1 }) // Sort by 'createdAt' in descending order
      .lean(); // .lean() to return a plain JavaScript object instead of a Mongoose document

    return res.json({ tweets }); // Send the tweets in JSON format
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error fetching tweets' });
  }
};

module.exports = {
  createTweet,
  getTweets,
  deleteTweet,
  timeline,
  getMyTweets,
};
