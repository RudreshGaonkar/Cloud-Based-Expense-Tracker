const sql = require('mssql');
const dbConfig = require('../config/db');

// Function to create a new expense
async function createExpense(userId, categoryId, title, amount, date, description) {
    try {
        let pool = await sql.connect(dbConfig);
        let query = `
            INSERT INTO dbo.Expenses (userId, categoryId, title, amount, date, description)
            OUTPUT INSERTED.*
            VALUES (@userId, @categoryId, @title, @amount, @date, @description)
        `;

        let result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('categoryId', sql.Int, categoryId)
            .input('title', sql.NVarChar(255), title)
            .input('amount', sql.Decimal(10, 2), amount)
            .input('date', sql.Date, date)
            .input('description', sql.NVarChar(150), description)
            .query(query);

        return result.recordset[0];
    } catch (error) {
        console.error('❌ Database Error (Create Expense):', error);
        throw error;
    }
}



// Function to fetch all expenses for a user
async function getExpenses(userId) {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT e.id, e.title, e.amount, e.date, e.description, c.name AS category 
                FROM dbo.Expenses e 
                JOIN dbo.Categories c ON e.categoryId = c.id 
                WHERE e.userId = @userId 
                ORDER BY e.date DESC
            `);
        return result.recordset;
    } catch (error) {
        console.error('❌ Database Error (Fetch Expenses):', error);
        throw error;
    }
}


module.exports = { createExpense, getExpenses };
