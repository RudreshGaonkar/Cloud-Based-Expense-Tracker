// backend/controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const userController = {
  // 🟢 User Registration
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
      }

      // Check if the user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists. Please log in.' });
      }

      // Create new user
      const newUser = await User.create(name, email, password);

      // Save the user info in the session
      req.session.user = { id: newUser.id, email, name };
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session error. Try logging in again." });
        }
        res.status(201).json({ message: 'User registered successfully', user: req.session.user });
      });

    } catch (error) {
      console.error('Error in userController.register:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  },

  // 🟢 User Login
  login : async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check password field (handle possible case differences)
        const hashedPassword = user.Password || user.password;

        // Compare password
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // ✅ Save user in session
        req.session.user = {
            id: user.Id || user.id,
            email: user.Email || user.email,
            name: user.Name || user.name
        };

        req.session.save((err) => {
            if (err) {
                console.error("❌ Session save error:", err);
                return res.status(500).json({ message: "Session error. Try logging in again." });
            }

            console.log("✅ User session set:", req.session.user); // Debug log
            res.status(200).json({ message: 'Login successful', user: req.session.user });
        });

    } catch (error) {
        console.error('❌ Error in userController.login:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
},
  
  // 🟢 User Logout
  logout: (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Logout failed. Try again." });
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.status(200).json({ message: 'Logged out successfully' });
      });
    } catch (error) {
      console.error('Error in userController.logout:', error);
      res.status(500).json({ message: 'Server error during logout' });
    }
  },

  // 🟢 Get User Profile
  getProfile: async (req, res) => {
    try {
      if (req.session && req.session.user) {
        return res.status(200).json({ user: req.session.user });
      }
      res.status(401).json({ message: 'Unauthorized. Please log in.' });
    } catch (error) {
      console.error('Error in userController.getProfile:', error);
      res.status(500).json({ message: 'Server error fetching profile' });
    }
  }
};

module.exports = userController;
