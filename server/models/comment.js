const mongoose = require('mongoose');

const { Schema } = mongoose;

// Define the main Comment schema
const CommentSchema = new Schema({
  tweetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reply', // Reference to the 'Reply' model
  }],
});

// Define the reply schema (separate collection for replies)
const replySchema = new Schema({
  content: { type: String, required: true }, // The content of the reply
  createdAt: { type: Date, default: Date.now }, // Timestamp
  username: { type: String, required: true }, // Username of the person replying
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true }, // Account owner reference
});

module.exports = {
  Comment: mongoose.model('Comment', CommentSchema),
  Reply: mongoose.model('Reply', replySchema),
};
