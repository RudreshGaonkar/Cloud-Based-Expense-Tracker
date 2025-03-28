const sql = require('mssql');
const dbConfig = require('../config/db');

// Function to fetch all predefined categories
async function getCategories() {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query('SELECT id, name FROM dbo.Categories');
        return result.recordset;
    } catch (error) {
        console.error('Database Error (Categories):', error);
        throw error;
    }
}

module.exports = { getCategories };
