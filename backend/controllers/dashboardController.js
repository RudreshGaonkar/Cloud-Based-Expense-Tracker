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
        const period = req.query.period || 'monthly'; 
        const pool = await poolPromise;
        let query = '';
        const currentYear = new Date().getFullYear();

        switch(period) {
            case 'daily':
                query = `
                    SELECT FORMAT(date, 'yyyy-MM-dd') AS day, SUM(amount) AS total
                    FROM Expenses
                    WHERE userId = @userId AND date >= DATEADD(day, -30, GETDATE())
                    GROUP BY FORMAT(date, 'yyyy-MM-dd')
                    ORDER BY day;
                `;
                break;
            case 'weekly':
                query = `
                    SELECT 
                        DATEPART(YEAR, date) AS year,
                        DATEPART(WEEK, date) AS week_number,
                        'Week ' + CAST(DATEPART(WEEK, date) AS VARCHAR) AS week, 
                        SUM(amount) AS total
                    FROM Expenses
                    WHERE userId = @userId 
                      AND DATEPART(YEAR, date) = ${currentYear}
                      AND date >= DATEADD(WEEK, -10, GETDATE())
                    GROUP BY DATEPART(YEAR, date), DATEPART(WEEK, date)
                    ORDER BY year, week_number;
                `;
                break;
            case 'monthly':
                query = `
                    SELECT FORMAT(date, 'yyyy-MM') AS month, SUM(amount) AS total
                    FROM Expenses
                    WHERE userId = @userId
                      AND DATEPART(YEAR, date) = ${currentYear}
                    GROUP BY FORMAT(date, 'yyyy-MM')
                    ORDER BY month;
                `;
                break;
            case 'yearly':
                query = `
                    SELECT 
                        DATEPART(YEAR, date) AS year,
                        SUM(amount) AS total
                    FROM Expenses
                    WHERE userId = @userId
                    GROUP BY DATEPART(YEAR, date)
                    ORDER BY year;
                `;
                break;
            default:
                query = `
                    SELECT FORMAT(date, 'yyyy-MM') AS month, SUM(amount) AS total
                    FROM Expenses
                    WHERE userId = @userId
                    GROUP BY FORMAT(date, 'yyyy-MM')
                    ORDER BY month;
                `;
        }

        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(query);


        if (period === 'weekly') {
            result.recordset.forEach(record => {

                const firstDayOfYear = new Date(record.year, 0, 1);
                const dayOfWeek = (record.week_number - 1) * 7;
                const approxDate = new Date(firstDayOfYear);
                approxDate.setDate(firstDayOfYear.getDate() + dayOfWeek);
             
                record.monthName = approxDate.toLocaleString('default', { month: 'long' });
            });
        }

        console.log(`📊 ${period.charAt(0).toUpperCase() + period.slice(1)} Expense Trends Data:`, result.recordset);
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

exports.getIncomeExpenseSummary = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        const userId = req.session.user.id;
        const period = req.query.period || 'month'; 
        
        const pool = await poolPromise;
        let dateFilter = '';

        switch(period) {
            case 'month':
                dateFilter = 'AND MONTH(e.date) = MONTH(GETDATE()) AND YEAR(e.date) = YEAR(GETDATE())';
                break;
            case 'quarter':
                dateFilter = 'AND e.date >= DATEADD(QUARTER, -1, GETDATE())';
                break;
            case 'year':
                dateFilter = 'AND YEAR(e.date) = YEAR(GETDATE())';
                break;
            case 'all':
                dateFilter = '';
                break;
            default:
                dateFilter = 'AND MONTH(e.date) = MONTH(GETDATE()) AND YEAR(e.date) = YEAR(GETDATE())';
        }

        const expenseQuery = `
            SELECT COALESCE(SUM(e.amount), 0) AS totalExpenses
            FROM Expenses e
            WHERE e.userId = @userId ${dateFilter};
        `;
        
        const incomeQuery = `
            SELECT COALESCE(SUM(i.amount), 0) AS totalIncome
            FROM Income i
            WHERE i.userId = @userId ${dateFilter.replace(/e\./g, 'i.')};
        `;
        
        const [expenseResult, incomeResult] = await Promise.all([
            pool.request().input('userId', sql.Int, userId).query(expenseQuery),
            pool.request().input('userId', sql.Int, userId).query(incomeQuery)
        ]);
        
        const totalExpenses = expenseResult.recordset[0]?.totalExpenses || 0;
        const totalIncome = incomeResult.recordset[0]?.totalIncome || 0;
        
        res.json({
            totalExpenses,
            totalIncome,
            netSavings: totalIncome - totalExpenses,
            period
        });
    } catch (error) {
        console.error("❌ Error fetching income/expense summary:", error);
        res.status(500).json({ message: "Error retrieving income/expense summary", error: error.message });
    }
};