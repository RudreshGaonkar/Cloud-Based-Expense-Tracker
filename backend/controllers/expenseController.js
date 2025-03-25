const { poolPromise, sql } = require('../config/db');

// ✅ Function to fetch paginated expenses
const getPaginatedExpenses = async (req, res) => {
    try {
        const userId = req.params.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('limit', sql.Int, limit)
            .input('offset', sql.Int, offset)
            .query(`
                SELECT e.id, e.title, e.amount, c.name AS category, e.date, e.description
                FROM dbo.Expenses e
                JOIN dbo.Categories c ON e.categoryId = c.id
                WHERE e.userId = @userId
                ORDER BY e.date DESC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            `);

        const totalResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`SELECT COUNT(*) AS total FROM dbo.Expenses WHERE userId = @userId`);

        const totalExpenses = totalResult.recordset[0]?.total || 0;
        const totalPages = totalExpenses > 0 ? Math.ceil(totalExpenses / limit) : 1;

        res.json({
            expenses: result.recordset || [],
            totalPages,
            currentPage: page,
            totalExpenses
        });
    } catch (error) {
        console.error("❌ Error fetching paginated expenses:", error);
        res.status(500).json({ message: "Error fetching expenses" });
    }
};



// ✅ Function to delete an expense
const deleteExpense = async (req, res) => {
    try {
        const expenseId = req.params.id;
        if (!expenseId) {
            return res.status(400).json({ message: "Expense ID is required" });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('expenseId', sql.Int, expenseId)
            .query(`DELETE FROM dbo.Expenses WHERE id = @expenseId`);

        if (result.rowsAffected[0] > 0) {
            res.json({ message: "Expense deleted successfully" });
        } else {
            res.status(404).json({ message: "Expense not found" });
        }
    } catch (error) {
        console.error("❌ Error deleting expense:", error);
        res.status(500).json({ message: "Error deleting expense" });
    }
};

// ✅ Function to add a new expense
const addExpense = async (req, res) => {
    try {
        const { userId, categoryId, amount, date, title, notes  } = req.body;
        if (!userId || !categoryId || !amount || !date || !title) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        
        const pool = await poolPromise;
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('categoryId', sql.Int, categoryId)
            .input('amount', sql.Decimal(10, 2), amount)
            .input('date', sql.Date, date)
            .input('title', sql.NVarChar(255), title)
            .input('description', sql.NVarChar(150), notes  || '')
            .query(`
                INSERT INTO dbo.Expenses (userId, categoryId, amount, date, title, description)
                VALUES (@userId, @categoryId, @amount, @date, @title, @description);
            `);

        res.status(201).json({ message: "Expense added successfully" });
    } catch (error) {
        console.error("❌ Error adding expense:", error);
        res.status(500).json({ message: "Error adding expense" });
    }
};

const updateExpense = async (req, res) => {
    try {
      const expenseId = req.params.id;
      const { title, amount, categoryId, date, notes } = req.body;
      if (!expenseId || !title || !amount || !categoryId || !date) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const pool = await poolPromise;
      const result = await pool.request()
        .input('expenseId', sql.Int, expenseId)
        .input('title', sql.VarChar(255), title)
        .input('amount', sql.Decimal(10, 2), amount)
        .input('categoryId', sql.Int, categoryId)
        .input('date', sql.Date, date)
        .input('notes', sql.VarChar(255), notes)
        .query(`
            UPDATE Expenses 
            SET title = @title,
                amount = @amount,
                categoryId = @categoryId,
                date = @date,
                notes = @notes
            WHERE id = @expenseId;
            SELECT * FROM Expenses WHERE id = @expenseId;
        `);
      res.json(result.recordset[0]);
    } catch (error) {
      console.error("❌ Error updating expense:", error);
      res.status(500).json({ message: "Error updating expense", error: error.message });
    }
  };


// ✅ Export all functions properly
module.exports = { addExpense, getPaginatedExpenses, deleteExpense, updateExpense };
