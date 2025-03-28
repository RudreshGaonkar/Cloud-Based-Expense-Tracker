const { sql, poolPromise } = require('../config/db');

const getExpenseTrends = async (req, res) => {
  try {
      const userId = req.query.userId;
      const period = req.query.period; // Can be 'day', 'week', 'month', 'year'

      if (!userId || !period) {
          return res.status(400).json({ message: "User ID and period are required" });
      }

      let groupByFormat;
      if (period === 'day') {
          groupByFormat = "FORMAT(date, 'yyyy-MM-dd')"; // Daily
      } else if (period === 'week') {
          groupByFormat = "DATEPART(YEAR, date) + '-W' + FORMAT(DATEPART(WEEK, date), '00')"; // Weekly
      } else if (period === 'month') {
          groupByFormat = "FORMAT(date, 'yyyy-MM')"; // Monthly
      } else if (period === 'year') {
          groupByFormat = "FORMAT(date, 'yyyy')"; // Yearly
      } else {
          return res.status(400).json({ message: "Invalid period format" });
      }

      const pool = await poolPromise;
      const result = await pool.request()
          .input('userId', sql.Int, userId)
          .query(`
              SELECT ${groupByFormat} AS period, SUM(amount) AS total
              FROM Expenses
              WHERE userId = @userId
              GROUP BY ${groupByFormat}
              ORDER BY period;
          `);

      res.json(result.recordset || []);
  } catch (error) {
      console.error("❌ Error fetching expense trends:", error);
      res.status(500).json({ message: "Error retrieving expense trends", error: error.message });
  }
};

const getFilteredExpenses = async (req, res) => {
  try {
      const userId = req.query.userId;
      const date = req.query.date || null; 
      const month = req.query.month || null; 
      const year = req.query.year || null; 

      if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
      }

      let whereClause = "WHERE userId = @userId";
      if (date) {
          whereClause += " AND FORMAT(date, 'yyyy-MM-dd') = @date";
      } else if (month) {
          whereClause += " AND FORMAT(date, 'yyyy-MM') = @month";
      } else if (year) {
          whereClause += " AND FORMAT(date, 'yyyy') = @year";
      }

      const pool = await poolPromise;
      const result = await pool.request()
          .input('userId', sql.Int, userId)
          .input('date', sql.NVarChar, date || null)
          .input('month', sql.NVarChar, month || null)
          .input('year', sql.NVarChar, year || null)
          .query(`
              SELECT title, amount, date
              FROM Expenses 
              ${whereClause}
              ORDER BY Date DESC;
          `);

      console.log("📊 Filtered Expenses SQL Result:", result.recordset);

      res.json(result.recordset || []);
  } catch (error) {
      console.error("❌ Error fetching filtered expenses:", error);
      res.status(500).json({ message: "Error retrieving expenses", error: error.message });
  }
};


const getExpenseSummary = async (req, res) => {
  try {
      const userId = req.query.userId; 
      if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
      }

      console.log(`✅ Fetching expense summary for userId: ${userId}`);

      const pool = await poolPromise;
      const result = await pool.request()
          .input('userId', sql.Int, userId)
          .query(`
              SELECT 
                  COALESCE(SUM(amount), 0) AS totalExpenses, 
                  COUNT(id) AS transactionCount,
                  COALESCE(AVG(amount), 0) AS avgDaily,
                  (SELECT TOP 1 c.name 
                   FROM Expenses e 
                   INNER JOIN Categories c ON e.categoryId = c.id
                   WHERE e.userId = @userId 
                   GROUP BY c.name 
                   ORDER BY SUM(e.amount) DESC) AS topCategory
              FROM Expenses 
              WHERE userId = @userId
          `);

      console.log("📊 Expense Summary Data:", result.recordset[0]);

      res.json(result.recordset[0] || {}); 
  } catch (error) {
      console.error("❌ Error fetching expense summary:", error);
      res.status(500).json({ message: "Error retrieving expense summary", error: error.message });
  }
};
 
  const getCategoryReport = async (req, res) => {
    try {
      const userId = req.query.userId; 
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
  
      const pool = await poolPromise;
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
            SELECT c.name AS category, SUM(e.amount) AS totalAmount
            FROM Expenses e
            INNER JOIN Categories c ON e.categoryId = c.id
            WHERE e.userId = @userId
            GROUP BY c.name
        `);
  
      res.json(result.recordset || []);
    } catch (error) {
      console.error("Error fetching category report:", error);
      res.status(500).json({ message: "Error retrieving category report", error: error.message });
    }
  };
  
  const getMonthlyTrends = async (req, res) => {
    try {
      const userId = req.query.userId;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const pool = await poolPromise;
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
            SELECT FORMAT(date, 'yyyy-MM') AS month, SUM(amount) AS total
            FROM Expenses
            WHERE userId = @userId
            GROUP BY FORMAT(date, 'yyyy-MM')
            ORDER BY month;
        `);
      res.json(result.recordset || []);
    } catch (error) {
      console.error("Error fetching monthly trends:", error);
      res.status(500).json({ message: "Error retrieving monthly trends", error: error.message });
    }
  };
  
  module.exports = {
    getExpenseSummary,
    getCategoryReport,
    getMonthlyTrends,
    getExpenseTrends,
    getFilteredExpenses
  };
  