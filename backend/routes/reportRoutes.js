const express = require('express');
const router = express.Router();
const { getExpenseSummary, getCategoryReport , getMonthlyTrends} = require('../controllers/reportController');

// No authMiddleware here
router.get('/summary', getExpenseSummary);
router.get('/categories', getCategoryReport);
router.get('/monthly', getMonthlyTrends);

module.exports = router;
