const User = require('../models/User');
require('dotenv').config(); 
const bcrypt = require('bcryptjs');
const { poolPromise, sql } = require('../config/db');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const userController = {

  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
      }


      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists. Please log in.' });
      }

      const newUser = await User.create(name, email, password);

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

  login: async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }


        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const hashedPassword = user.Password || user.password;


        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

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

            console.log("✅ User session set:", req.session.user); 
            res.status(200).json({ message: 'Login successful', user: req.session.user });
        });

    } catch (error) {
        console.error('❌ Error in userController.login:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
  },
  

  googleLogin: async (req, res) => {
    try {
      const { token } = req.body;
      console.log("GOOGLE_CLIENT_ID from env:", process.env.GOOGLE_CLIENT_ID);
      
      if (!token) {
        return res.status(400).json({ message: 'Google token is required' });
      }
      

      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      const { email, name, sub: googleId } = payload;
      

      let user = await User.findByEmail(email);
      
      if (!user) {

        const randomPassword = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);
        

        const pool = await poolPromise;
        const result = await pool.request()
          .input('name', sql.VarChar, name)
          .input('email', sql.VarChar, email)
          .input('password', sql.VarChar, hashedPassword)
          .input('googleId', sql.VarChar, googleId)
          .query(`INSERT INTO Users (name, email, password, googleId) 
                  VALUES (@name, @email, @password, @googleId); 
                  SELECT SCOPE_IDENTITY() as id;`);
                  
        user = {
          id: result.recordset[0].id,
          email,
          name
        };
      } else if (!user.GoogleId) {
        const pool = await poolPromise;
        await pool.request()
          .input('email', sql.VarChar, email)
          .input('googleId', sql.VarChar, googleId)
          .query('UPDATE Users SET googleId = @googleId WHERE email = @email');
      }
      

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
        
        console.log("✅ Google user session set:", req.session.user);
        res.status(200).json({ message: 'Google login successful', user: req.session.user });
      });
      
    } catch (error) {
      console.error('❌ Error in userController.googleLogin:', error);
      res.status(500).json({ message: 'Server error during Google login' });
    }
  },
  
  logout: (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Logout failed. Try again." });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully' });
      });
    } catch (error) {
      console.error('Error in userController.logout:', error);
      res.status(500).json({ message: 'Server error during logout' });
    }
  },

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
  },

  updateProfile: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
      }

      const { name } = req.body;
      const userId = req.session.user.id;


      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }


      const pool = await poolPromise;
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('name', sql.VarChar, name)
        .query('UPDATE Users SET name = @name WHERE id = @userId');

   
      req.session.user.name = name;
      
      res.status(200).json({ 
        message: 'Profile updated successfully',
        user: req.session.user
      });

    } catch (error) {
      console.error('Error in updateProfile:', error);
      res.status(500).json({ message: 'Server error while updating profile' });
    }
  },

  changePassword: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
      }
  
      const { currentPassword, newPassword } = req.body;
      const userId = req.session.user.id;
  

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide current and new passwords' });
      }
  

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  

      const isMatch = await bcrypt.compare(currentPassword, user.Password || user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
  

      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);
  

      const pool = await poolPromise;
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('newPassword', sql.VarChar, hashedNewPassword)
        .query('UPDATE Users SET password = @newPassword WHERE Id = @userId');
  
      res.status(200).json({ message: 'Password updated successfully' });
  
    } catch (error) {
      console.error('Error in changePassword:', error);
      res.status(500).json({ message: 'Server error while changing password' });
    }
  }
};

module.exports = userController;