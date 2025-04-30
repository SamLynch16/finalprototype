const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  // User login routes
  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);

  // User signup routes
  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);

  // User logout route
  app.get('/logout', mid.requiresLogin, controllers.Account.logout);

  // Timeline route - users will see tweets here
  app.get('/timeline', mid.requiresLogin, controllers.Tweet.timeline);

  // Create new tweet route
  app.post('/tweet', mid.requiresLogin, controllers.Tweet.createTweet);

  // Delete a tweet (this assumes the user is the owner of the tweet)
  app.delete('/tweet/:id', mid.requiresLogin, controllers.Tweet.deleteTweet);

  // Profile page - users can view their profile and tweets
  app.get('/profile', mid.requiresLogin, controllers.Account.profilePage);

  app.get('/getTweets', mid.requiresLogin, controllers.Tweet.getTweets);

  app.get('/getMyTweets', mid.requiresLogin, controllers.Tweet.getMyTweets);
  // Route to the home page (login page if the user is not logged in)
  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);

  // Create a comment on a tweet
  app.post('/tweets/:tweetId/comments', mid.requiresLogin, controllers.Tweet.addComment);

  // Get comments for a tweet
  app.get('/tweets/:tweetId/comments', mid.requiresLogin, controllers.Tweet.getComments);

  app.post('/like/:id', mid.requiresLogin, controllers.Tweet.likeTweet);
  app.post('/unlike/:id', mid.requiresLogin, controllers.Tweet.unlikeTweet);

  // Delete a comment
  app.delete('/tweets/:tweetId/comments/:commentId', mid.requiresLogin, controllers.Tweet.deleteComment);

  // **New Route**: Reply to a comment
  app.post('/tweets/:tweetId/comments/:commentId/replies', mid.requiresLogin, controllers.Tweet.replyToComment);
  // Delete a reply
  app.delete('/tweets/:tweetId/comments/:commentId/replies/:replyId', mid.requiresLogin, controllers.Tweet.deleteReply);

  app.put('/updateUsername', mid.requiresLogin, controllers.Account.updateUsername);
  app.put('/updatePassword', mid.requiresLogin, controllers.Account.updatePassword);
};

module.exports = router;
