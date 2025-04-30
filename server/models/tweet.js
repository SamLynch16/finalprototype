const mongoose = require('mongoose');
const _ = require('underscore');

// A function to escape and trim tweet content (like preventing HTML injections)
const setContent = (content) => _.escape(content).trim();

const TweetSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    set: setContent,
    maxlength: 280,
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Account',
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// This controls what gets sent to the frontend
TweetSchema.statics.toAPI = (doc) => ({
  content: doc.content,
  owner: doc.owner,
  timestamp: doc.createdAt,
  // comments: doc.comments,  // optional: you could include comments here if needed
});

const TweetModel = mongoose.model('Tweet', TweetSchema);
module.exports = TweetModel;
