const { sql, poolPromise } = require('../config/db');

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


// const getExpenseSummary = async (req, res) => {
//   try {
//       const userId = req.query.userId; 
//       if (!userId) {
//           return res.status(400).json({ message: "User ID is required" });
//       }

//       console.log(`✅ Fetching expense summary for userId: ${userId}`);

//       const pool = await poolPromise;
//       const result = await pool.request()
//           .input('userId', sql.Int, userId)
//           .query(`
//               SELECT 
//                   COALESCE(SUM(amount), 0) AS totalExpenses, 
//                   COUNT(id) AS transactionCount,
//                   COALESCE(AVG(amount), 0) AS avgDaily,
//                   (SELECT TOP 1 c.name 
//                    FROM Expenses e 
//                    INNER JOIN Categories c ON e.categoryId = c.id
//                    WHERE e.userId = @userId 
//                    GROUP BY c.name 
//                    ORDER BY SUM(e.amount) DESC) AS topCategory
//               FROM Expenses 
//               WHERE userId = @userId
//           `);

//       console.log("📊 Expense Summary Data:", result.recordset[0]);

//       res.json(result.recordset[0] || {}); 
//   } catch (error) {
//       console.error("❌ Error fetching expense summary:", error);
//       res.status(500).json({ message: "Error retrieving expense summary", error: error.message });
//   }
// };
 
const getExpenseSummary = async (req, res) => {
    try {
        const userId = req.query.userId; 
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
  
        console.log(`✅ Fetching expense & income summary for userId: ${userId}`);
  
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                WITH ExpenseData AS (
                    SELECT 
                        COALESCE(SUM(amount), 0) AS totalExpenses, 
                        COUNT(id) AS transactionCount,
                        -- Calculate monthly average instead of daily average
                        COALESCE(SUM(amount) / 
                            NULLIF(COUNT(DISTINCT FORMAT(date, 'yyyy-MM')), 0), 0) AS avgMonthly,
                        (SELECT TOP 1 c.name 
                         FROM Expenses e 
                         INNER JOIN Categories c ON e.categoryId = c.id
                         WHERE e.userId = @userId 
                         GROUP BY c.name 
                         ORDER BY SUM(e.amount) DESC) AS topCategory
                    FROM Expenses 
                    WHERE userId = @userId
                ),
                IncomeData AS (
                    SELECT COALESCE(SUM(amount), 0) AS totalIncome 
                    FROM Income 
                    WHERE userId = @userId
                )
                SELECT 
                    e.totalExpenses,
                    i.totalIncome,
                    (i.totalIncome - e.totalExpenses) AS remainingIncome,
                    e.transactionCount,
                    e.avgMonthly,
                    e.topCategory
                FROM ExpenseData e, IncomeData i;
            `);
  
        console.log("📊 Expense & Income Summary Data:", result.recordset[0]);
  
        res.json(result.recordset[0] || {}); 
    } catch (error) {
        console.error("❌ Error fetching expense & income summary:", error);
        res.status(500).json({ message: "Error retrieving summary", error: error.message });
    }
  };

const getExpenseTrends = async (req, res) => {
    try {
        const userId = req.query.userId;
        const period = req.query.period; // Can be 'day', 'week', 'month', 'year'
        
        // Get current year
        const currentYear = new Date().getFullYear();
  
        if (!userId || !period) {
            return res.status(400).json({ message: "User ID and period are required" });
        }
  
        let groupByFormat;
        let dateFilter = '';
        
        if (period === 'day') {
            groupByFormat = "FORMAT(date, 'yyyy-MM-dd')"; // Daily
            dateFilter = `AND YEAR(date) = ${currentYear}`;
        } else if (period === 'week') {
            groupByFormat = "CONCAT(DATEPART(YEAR, date), '-W', FORMAT(DATEPART(WEEK, date), '00'))"; // Weekly
            dateFilter = `AND YEAR(date) = ${currentYear}`;
        } else if (period === 'month') {
            groupByFormat = "FORMAT(date, 'yyyy-MM')"; // Monthly
            dateFilter = `AND YEAR(date) = ${currentYear}`;
        } else if (period === 'year') {
            groupByFormat = "FORMAT(date, 'yyyy')"; // Yearly
        } else {
            return res.status(400).json({ message: "Invalid period format" });
        }
  
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                WITH ExpenseData AS (
                    SELECT ${groupByFormat} AS period, SUM(amount) AS totalExpense
                    FROM Expenses
                    WHERE userId = @userId ${dateFilter}
                    GROUP BY ${groupByFormat}
                ),
                IncomeData AS (
                    SELECT ${groupByFormat} AS period, SUM(amount) AS totalIncome
                    FROM Income
                    WHERE userId = @userId ${dateFilter}
                    GROUP BY ${groupByFormat}
                )
                SELECT 
                    COALESCE(e.period, i.period) AS period, 
                    COALESCE(totalExpense, 0) AS totalExpense, 
                    COALESCE(totalIncome, 0) AS totalIncome
                FROM ExpenseData e
                FULL OUTER JOIN IncomeData i 
                ON e.period = i.period
                ORDER BY period;
            `);
  
        res.json(result.recordset || []);
    } catch (error) {
        console.error("❌ Error fetching expense & income trends:", error);
        res.status(500).json({ message: "Error retrieving trends", error: error.message });
    }
  };

//   const getCategoryReport = async (req, res) => {
//     try {
//       const userId = req.query.userId; 
//       if (!userId) {
//         return res.status(400).json({ message: "User ID is required" });
//       }
  
//       const pool = await poolPromise;
//       const result = await pool.request()
//         .input('userId', sql.Int, userId)
//         .query(`
//             SELECT c.name AS category, SUM(e.amount) AS totalAmount
//             FROM Expenses e
//             INNER JOIN Categories c ON e.categoryId = c.id
//             WHERE e.userId = @userId
//             GROUP BY c.name
//         `);
  
//       res.json(result.recordset || []);
//     } catch (error) {
//       console.error("Error fetching category report:", error);
//       res.status(500).json({ message: "Error retrieving category report", error: error.message });
//     }
//   };
  
const getCategoryReport = async (req, res) => {
    try {
      const userId = req.query.userId;
      const month = req.query.month || null;
  
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
  
      let whereClause = "e.userId = @userId";
      if (month) {
        whereClause += " AND FORMAT(e.date, 'yyyy-MM') = @month";
      }
  
      const pool = await poolPromise;
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('month', sql.NVarChar, month || null)
        .query(`
            SELECT c.name AS category, SUM(e.amount) AS totalAmount
            FROM Expenses e
            INNER JOIN Categories c ON e.categoryId = c.id
            WHERE ${whereClause}
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

  const getMonthlyIncome = async (req, res) => {
    try {
        const userId = req.query.userId;
        const month = req.query.month;
        
        if (!userId || !month) {
            return res.status(400).json({ message: "User ID and month are required" });
        }
        
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('month', sql.NVarChar, month)
            .query(`
                SELECT COALESCE(SUM(amount), 0) AS totalIncome
                FROM Income
                WHERE userId = @userId 
                AND FORMAT(date, 'yyyy-MM') = @month
            `);
        
        console.log("💰 Monthly Income Data:", result.recordset[0]);
        
        res.json(result.recordset[0] || { totalIncome: 0 });
    } catch (error) {
        console.error("❌ Error fetching monthly income:", error);
        res.status(500).json({ message: "Error retrieving monthly income", error: error.message });
    }
};

const getFilteredIncome = async (req, res) => {
    try {
        const userId = req.query.userId;
        const month = req.query.month || null;
        
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
  
        let whereClause = "WHERE userId = @userId";
        if (month) {
            whereClause += " AND FORMAT(date, 'yyyy-MM') = @month";
        }
  
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('month', sql.NVarChar, month || null)
            .query(`
                SELECT description, amount, date
                FROM Income 
                ${whereClause}
                ORDER BY Date DESC;
            `);
  
        console.log("💰 Filtered Income SQL Result:", result.recordset);
  
        res.json(result.recordset || []);
    } catch (error) {
        console.error("❌ Error fetching filtered income:", error);
        res.status(500).json({ message: "Error retrieving income records", error: error.message });
    }
  };
  
  
  module.exports = {
    getExpenseSummary,
    getCategoryReport,
    getMonthlyTrends,
    getExpenseTrends,
    getFilteredExpenses,
    getMonthlyIncome,
    getFilteredIncome
  };
  