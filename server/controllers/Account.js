const bcrypt = require('bcrypt');
const models = require('../models');

// eslint-disable-next-line prefer-destructuring
const Account = models.Account;

console.log('Account from models:', Account); // Check what is being imported

// render the login page
const loginPage = (req, res) => res.render('login');

// destroy the session and redirect to homepage on logout
const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

// handle user login
const login = (req, res) => {
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;

  if (!username || !pass) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  return Account.authenticate(username, pass, (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Wrong username or password!' });
    }
    req.session.account = Account.toAPI(account);
    console.log('Session after login:', req.session);

    return res.json({ redirect: '/timeline' });
  });
};

// Handle new user signup
const signup = async (req, res) => {
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;
  const pass2 = `${req.body.pass2}`;

  if (!username || !pass || !pass2) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  if (pass !== pass2) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    const hash = await Account.generateHash(pass);
    const newAccount = new Account({ username, password: hash });
    await newAccount.save();
    req.session.account = Account.toAPI(newAccount);
    return res.json({ redirect: '/timeline' });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username already in use!' });
    }
    return res.status(500).json({ error: 'An error occured!' });
  }
};

// Render the profile page (can be enhanced to pass dynamic user data)
const profilePage = (req, res) => {
  res.render('profile'); // Example dynamic data
};

// Handle username update
const updateUsername = async (req, res) => {
  if (!req.session.account) {
    return res.status(403).json({ error: 'User not authenticated' });
  }

  const newUsername = req.body.username;

  try {
    // Check if new username is already taken
    const existingUser = await Account.findOne({ username: newUsername });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Update current user's username
    const user = await Account.findById(req.session.account._id);
    user.username = newUsername;
    await user.save();

    req.session.account.username = newUsername; // Update the session too

    return res.json({ message: 'Username updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update username' });
  }
};

// handle updating password
const updatePassword = async (req, res) => {
  if (!req.session.account) {
    return res.status(403).json({ error: 'User not authenticated' });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    // Find the current user
    const user = await Account.findById(req.session.account._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the password
    user.password = hashedPassword;
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update password' });
  }
};

module.exports = {
  loginPage,
  login,
  logout,
  signup,
  profilePage,
  updateUsername,
  updatePassword,
};
