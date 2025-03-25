const { sql, poolPromise } = require('../config/db');

exports.getDashboardSummary = async (req, res) => {
    try {
        console.log("📡 Checking session:", req.session); // Debug session

        // ✅ Ensure session exists
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        const userId = req.session.user.id; // 🚀 Now it won't crash
        console.log("✅ User ID from session:", userId);

        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    COALESCE(SUM(amount), 0) AS totalExpenses, 
                    COUNT(id) AS transactionCount,
                    COALESCE(SUM(amount) / NULLIF(COUNT(DISTINCT date), 0), 0) AS avgDaily
                FROM Expenses 
                WHERE userId = @userId;
            `);

        res.json(result.recordset[0] || {});
    } catch (error) {
        console.error("❌ Error fetching dashboard summary:", error);
        res.status(500).json({ message: "Error retrieving summary", error: error.message });
    }
};


exports.getRecentExpenses = async (req, res) => {
    try {
        console.log("📡 Checking session in recent expenses:", req.session);
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        const userId = req.session.user.id;
        console.log("✅ User ID from session:", userId);

        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT TOP 5 Title, Amount, Category, Date 
                FROM Expenses 
                WHERE UserId = @userId 
                ORDER BY Date DESC;
            `);

        console.log("📊 Fetched Recent Expenses:", result.recordset);
        res.json(result.recordset || []);
    } catch (error) {
        console.error("❌ Error fetching recent expenses:", error);
        res.status(500).json({ message: "Error retrieving recent expenses", error: error.message });
    }
};
