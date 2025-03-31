const { poolPromise, sql } = require('../config/db');

class Income {

    static async addIncome(userId, amount, date, description) {
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('UserId', sql.Int, userId)
                .input('Amount', sql.Decimal(18,2), amount)
                .input('Date', sql.Date, date)
                .input('Description', sql.VarChar(255), description)
                .query(`
                    INSERT INTO dbo.Income (userId, amount, date, description)
                    VALUES (@UserId, @Amount, @Date, @Description)
                `);
            return { success: true, message: "Income added successfully." };
        } catch (error) {
            console.error("Error adding income:", error);
            return { success: false, message: "Failed to add income." };
        }
    }

    static async getTotalIncome(userId, month, year) {
        try {
            const pool = await poolPromise;
            const result = await pool
                .request()
                .input('userId', sql.Int, userId)
                .input('month', sql.Int, month)
                .input('year', sql.Int, year)
                .query(`
                    SELECT COALESCE(SUM(amount), 0) AS TotalIncome
                    FROM dbo.Income
                    WHERE userId = @userId AND MONTH(date) = @month AND YEAR(date) = @year
                `);
            return result.recordset[0].TotalIncome;
        } catch (error) {
            throw error;
        }
    }

    static async getIncomeRecords(userId, page = 1, limit = 7) {
        try {
            const offset = (page - 1) * limit;
            const pool = await poolPromise;
            
            // Get paginated records
            const recordsResult = await pool
                .request()
                .input('userId', sql.Int, userId)
                .input('offset', sql.Int, offset)
                .input('limit', sql.Int, limit)
                .query(`
                    SELECT amount, date, description
                    FROM dbo.Income
                    WHERE userId = @userId
                    ORDER BY date DESC
                    OFFSET @offset ROWS
                    FETCH NEXT @limit ROWS ONLY
                `);
            
            // Get total count for pagination
            const countResult = await pool
                .request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT COUNT(*) AS totalCount
                    FROM dbo.Income
                    WHERE userId = @userId
                `);
            
            const totalCount = countResult.recordset[0].totalCount;
            const totalPages = Math.ceil(totalCount / limit);
            
            return {
                records: recordsResult.recordset,
                totalCount,
                totalPages,
                currentPage: page
            };
        } catch (error) {
            console.error("Error fetching income records:", error);
            throw error;
        }
    }
}

module.exports = Income;