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
};

module.exports = router;
