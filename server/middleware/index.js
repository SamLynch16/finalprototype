// Ensures that the user is logged in before accessing certain routes (like posting a tweet)
const requiresLogin = (req, res, next) => {
  if (!req.session.account) {
    return res.redirect('/');
  }
  return next();
};

// Ensures that the user is logged out before accessing certain routes (like signing up)
const requiresLogout = (req, res, next) => {
  if (req.session.account) {
    return res.redirect('/timeline'); // Redirect to the user's timeline after login
  }
  return next();
};

// Secure connection enforcement (ensure HTTPS in production)
const requiresSecure = (req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.hostname}${req.url}`);
  }
  return next();
};

// Allow non-https traffic in development environment (bypass secure check)
const bypassSecure = (req, res, next) => {
  next();
};

module.exports.requiresLogin = requiresLogin;
module.exports.requiresLogout = requiresLogout;

// Apply the secure connection requirement only in production
if (process.env.NODE_ENV === 'production') {
  module.exports.requiresSecure = requiresSecure;
} else {
  module.exports.requiresSecure = bypassSecure;
}
