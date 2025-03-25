const bcrypt = require('bcrypt');
const { sql, initializeDatabase } = require('../config/db');
const User = require('../models/User'); // if you have a User model

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Get a connection pool by calling initializeDatabase()
    const pool = await initializeDatabase();

    // Check if the email already exists
    const emailCheckResult = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (emailCheckResult.recordset.length > 0) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user and retrieve new user id using SCOPE_IDENTITY()
    const result = await pool
      .request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .query(
        'INSERT INTO Users (name, email, password) VALUES (@name, @email, @password); SELECT SCOPE_IDENTITY() AS userId;'
      );

    const userId = result.recordset[0].userId;
    const user = { id: userId, name, email };

    res.status(201).json({ message: 'Registration successful.', user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Server error.' });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Get a connection pool from initializeDatabase()
    const pool = await initializeDatabase();

    // Retrieve the user by email
    const userResult = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (userResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = userResult.recordset[0];

    if (!user.password) {
      return res.status(500).json({ message: 'User record incomplete: password missing' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Set session and cookie (if using sessions)
    req.session.user = user;
    res.cookie('userId', user.id, { maxAge: 3600000, httpOnly: true });

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.logoutUser = (req, res) => {
  req.session.destroy();
  res.clearCookie('userId');
  res.json({ message: 'Logout successful' });
};
