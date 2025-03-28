// backend/models/User.js
// This file contains functions to interact with the Users table in the database

const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  // Create a new user with hashed password
  create: async (name, email, password) => {
    try {
      // Hash the password using bcryptjs
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const pool = await poolPromise;
      const result = await pool.request()
        .input('name', sql.VarChar, name)
        .input('email', sql.VarChar, email)
        .input('password', sql.VarChar, hashedPassword)
        .query(`INSERT INTO Users (Name, Email, Password) 
                VALUES (@name, @email, @password); 
                SELECT SCOPE_IDENTITY() as id;`);

      return result.recordset[0];
    } catch (error) {
      console.error('Error in User.create: ', error);
      throw error;
    }
  },

  // Find a user by email
  findByEmail: async (email) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('email', sql.VarChar, email)
        .query('SELECT * FROM Users WHERE Email = @email');
      return result.recordset[0];
    } catch (error) {
      console.error('Error in User.findByEmail: ', error);
      throw error;
    }
  },

  // Find a user by ID
  findById: async (id) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM Users WHERE Id = @id');
      return result.recordset[0];
    } catch (error) {
      console.error('Error in User.findById: ', error);
      throw error;
    }
  },
};

module.exports = User;
