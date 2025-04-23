const mongoose = require('mongoose');
const _ = require('underscore');

// A function to escape and trim tweet content (like preventing HTML injections)
const setContent = (content) => _.escape(content).trim();

const TweetSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    set: setContent, // Sanitizing the content
    maxlength: 280, // Limit the tweet to 280 characters (like Twitter)
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Account', // This will link to the Account model (the user who posted the tweet)
  },
  createdAt: {
    type: Date,
    default: Date.now, // Timestamp when the tweet was created
  },
});

TweetSchema.statics.toAPI = (doc) => ({
  content: doc.content,
  owner: doc.owner,
  timestamp: doc.createdAt,
});

const TweetModel = mongoose.model('Tweet', TweetSchema);
module.exports = TweetModel;
