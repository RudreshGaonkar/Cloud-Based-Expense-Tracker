const express = require('express');
const router = express.Router();
const {
    getDashboardSummary,
    getExpenseTrends,
    getCategoryDistribution,
    getRecentExpenses,
    getIncomeExpenseSummary
} = require('../controllers/dashboardController');

router.get('/summary', getDashboardSummary);
router.get('/trends', getExpenseTrends);
router.get('/categories', getCategoryDistribution);
router.get('/recent', getRecentExpenses);
router.get('/income-expense', getIncomeExpenseSummary);

module.exports = router;