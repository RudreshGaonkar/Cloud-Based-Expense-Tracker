

require('dotenv').config(); 
const sql = require('mssql');

// Debug missing environment variables
if (!process.env.DB_SERVER) console.error(" Missing DB_SERVER in .env file");
if (!process.env.DB_USER) console.error(" Missing DB_USER in .env file");
if (!process.env.DB_PASSWORD) console.error("Missing DB_PASSWORD in .env file");
if (!process.env.DB_DATABASE) console.error(" Missing DB_DATABASE in .env file");


const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true, 
    trustServerCertificate: false,
  },
};


const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to Azure SQL Database');
    return pool;
  })
  .catch(err => {
    console.error('Database Connection Failed! Bad Config: ', err);
    process.exit(1);
  });

module.exports = { sql, poolPromise };
