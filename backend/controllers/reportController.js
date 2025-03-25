const { sql, poolPromise } = require('../config/db');

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

// exports.getCategoryReport = async (req, res) => {
//     try {
//         const userId = req.query.userId; // ✅ Get userId from query params
//         if (!userId) {
//             return res.status(400).json({ message: "User ID is required" });
//         }

//         const pool = await poolPromise;
//         const result = await pool.request()
//             .input('userId', sql.Int, userId)
//             .query(`
//                 SELECT c.name AS category, SUM(e.amount) AS totalAmount
//                 FROM Expenses e
//                 INNER JOIN Categories c ON e.categoryId = c.id
//                 WHERE e.userId = @userId
//                 GROUP BY c.name
//             `);

//         res.json(result.recordset);
//     } catch (error) {
//         console.error("Error fetching category report:", error);
//         res.status(500).json({ message: "Error retrieving category report", error: error.message });
//     }
// };


// const getExpenseSummary = async (req, res) => {
//     try {
//       const userId = req.query.userId; 
//       if (!userId) {
//         return res.status(400).json({ message: "User ID is required" });
//       }
  
//       console.log(`✅ Fetching expense summary for userId: ${userId}`);
  
//       const pool = await poolPromise;
//       const result = await pool.request()
//         .input('userId', sql.Int, userId)
//         .query(`
//             SELECT 
//                 COALESCE(SUM(amount), 0) AS totalExpenses, 
//                 COUNT(id) AS transactionCount,
//                 COALESCE(SUM(amount) / NULLIF(COUNT(DISTINCT date), 0), 0) AS avgDaily
//             FROM Expenses 
//             WHERE userId = @userId;
//         `);
  
//       console.log("📊 Expense Summary Data:", result.recordset[0]);
//       res.json(result.recordset[0] || {}); 
//     } catch (error) {
//       console.error("❌ Error fetching expense summary:", error);
//       res.status(500).json({ message: "Error retrieving expense summary", error: error.message });
//     }
//   };
  
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
    getMonthlyTrends
  };
  