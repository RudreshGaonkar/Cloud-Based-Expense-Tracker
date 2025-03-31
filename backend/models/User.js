const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {

  create: async (name, email, password, googleId = null) => {
    try {
      // Hash the password using bcryptjs
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const pool = await poolPromise;
      const request = pool.request()
        .input('name', sql.VarChar, name)
        .input('email', sql.VarChar, email)
        .input('password', sql.VarChar, hashedPassword);
      
      if (googleId) {
        request.input('googleId', sql.VarChar, googleId);
      }
      
      const query = googleId 
        ? `INSERT INTO Users (name, email, password, googleId) 
           VALUES (@name, @email, @password, @googleId); 
           SELECT SCOPE_IDENTITY() as id;`
        : `INSERT INTO Users (name, email, password) 
           VALUES (@name, @email, @password); 
           SELECT SCOPE_IDENTITY() as id;`;
           
      const result = await request.query(query);

      return result.recordset[0];
    } catch (error) {
      console.error('Error in User.create: ', error);
      throw error;
    }
  },


  findByEmail: async (email) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('email', sql.VarChar, email)
        .query('SELECT * FROM Users WHERE email = @email');
      return result.recordset[0];
    } catch (error) {
      console.error('Error in User.findByEmail: ', error);
      throw error;
    }
  },


  findById: async (id) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM Users WHERE id = @id');
      return result.recordset[0];
    } catch (error) {
      console.error('Error in User.findById: ', error);
      throw error;
    }
  },
  
  // Find a user by Google ID
  findByGoogleId: async (googleId) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('googleId', sql.VarChar, googleId)
        .query('SELECT * FROM Users WHERE googleId = @googleId');
      return result.recordset[0];
    } catch (error) {
      console.error('Error in User.findByGoogleId: ', error);
      throw error;
    }
  }
};

module.exports = User;