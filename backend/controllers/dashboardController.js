const { sql, poolPromise } = require('../config/db');

exports.getDashboardSummary = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        const userId = req.session.user.id;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    COALESCE(SUM(e.amount), 0) AS totalExpenses,
                    (SELECT COUNT(*) FROM Categories) AS categoryCount, --  Count from Categories table
                    COALESCE(SUM(CASE WHEN MONTH(e.date) = MONTH(GETDATE()) THEN e.amount ELSE 0 END), 0) AS monthlyExpenses,
                    COALESCE((SELECT TOP 1 e.amount FROM Expenses e WHERE e.userId = @userId ORDER BY e.date DESC), 0) AS recentExpense
                FROM Expenses e
                WHERE e.userId = @userId;
            `);

        res.json(result.recordset[0] || {});
    } catch (error) {
        console.error("Error fetching dashboard summary:", error);
        res.status(500).json({ message: "Error retrieving summary", error: error.message });
    }
};

exports.getExpenseTrends = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        const userId = req.session.user.id;
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

        console.log("📊 Expense Trends Data:", result.recordset);
        res.json(result.recordset || []);
    } catch (error) {
        console.error("❌ Error fetching expense trends:", error);
        res.status(500).json({ message: "Error retrieving trends", error: error.message });
    }
};

exports.getCategoryDistribution = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        const userId = req.session.user.id;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT c.name AS category, SUM(e.amount) AS totalAmount
                FROM Expenses e
                INNER JOIN Categories c ON e.categoryId = c.id
                WHERE e.userId = @userId
                GROUP BY c.name;
            `);

        console.log("📊 Category Distribution Data:", result.recordset);
        res.json(result.recordset || []);
    } catch (error) {
        console.error("❌ Error fetching category distribution:", error);
        res.status(500).json({ message: "Error retrieving category distribution", error: error.message });
    }
};

exports.getRecentExpenses = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        const userId = req.session.user.id;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT TOP 5 Title, Amount, Date, 
                    (SELECT Name FROM Categories WHERE Id = e.CategoryId) AS Category
                FROM Expenses e
                WHERE UserId = @userId 
                ORDER BY Date DESC;
            `);

        console.log("📊 Recent Expenses Data:", result.recordset);
        res.json(result.recordset || []);
    } catch (error) {
        console.error("❌ Error fetching recent expenses:", error);
        res.status(500).json({ message: "Error retrieving recent expenses", error: error.message });
    }
};
