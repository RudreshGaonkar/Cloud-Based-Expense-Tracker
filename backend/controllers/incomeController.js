const Income = require('../models/Income');

exports.getIncomeSummary = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const totalIncome = await Income.getTotalIncome(userId, month, year);
    
    res.json({ totalIncome });
  } catch (error) {
    console.error('Error fetching income summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addIncome = async (req, res) => {
    const { amount, date, description } = req.body;
    const userId = req.session.user ? req.session.user.id : null;

    if (!userId) return res.status(401).json({ message: "Unauthorized. Please log in." });

    if (!amount || !date) {
        return res.status(400).json({ message: "Amount and date are required." });
    }

    const result = await Income.addIncome(userId, amount, date, description);
    return res.status(result.success ? 200 : 500).json(result);
};

exports.getTotalIncome = async (req, res) => {
    const userId = req.session.user ? req.session.user.id : null;
    if (!userId) return res.status(401).json({ message: "Unauthorized. Please log in." });

    const month = req.query.month || new Date().getMonth() + 1;
    const year = req.query.year || new Date().getFullYear();

    const totalIncome = await Income.getTotalIncome(userId, month, year);
    return res.json({ totalIncome });
};

exports.getIncomeRecords = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;
        if (!userId) return res.status(401).json({ message: "Unauthorized. Please log in." });

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 7;

        const result = await Income.getIncomeRecords(userId, page, limit);
        return res.json(result);
    } catch (error) {
        console.error('Error fetching income records:', error);
        return res.status(500).json({ message: 'Failed to fetch income records.' });
    }
};

exports.getReportSummary = async (req, res) => {
  try {
      const userId = req.session.user?.id;
      if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
      }

      const pool = await poolPromise;
      const result = await pool
          .request()
          .input("userId", sql.Int, userId)
          .query(`
              SELECT 
                  ISNULL(SUM(e.amount), 0) AS totalExpenses,
                  COUNT(e.id) AS transactionCount,
                  ISNULL(SUM(e.amount) / NULLIF(DATEDIFF(DAY, MIN(e.date), MAX(e.date)), 0), 0) AS avgDaily,
                  (SELECT TOP 1 c.name 
                   FROM dbo.Expenses e2
                   JOIN dbo.Categories c ON e2.categoryId = c.id
                   WHERE e2.userId = @userId
                   GROUP BY c.name
                   ORDER BY SUM(e2.amount) DESC) AS topCategory
              FROM dbo.Expenses e
              WHERE e.userId = @userId
          `);

      res.json(result.recordset[0]);
  } catch (error) {
      console.error("Error fetching report summary:", error);
      res.status(500).json({ message: "Server error" });
  }
};