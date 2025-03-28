const { poolPromise } = require('../config/db');

const fetchCategories = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM dbo.Categories');
        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: "Error fetching categories" });
    }
};

module.exports = { fetchCategories };
