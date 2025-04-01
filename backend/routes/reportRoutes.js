const express = require('express');
const router = express.Router();
const { 
    getExpenseSummary, 
    getCategoryReport, 
    getMonthlyTrends, 
    getExpenseTrends,  
    getFilteredExpenses ,
    getMonthlyIncome
} = require('../controllers/reportController');


router.get('/summary', getExpenseSummary);
router.get('/categories', getCategoryReport);
router.get('/monthly', getMonthlyTrends);
router.get('/trends', getExpenseTrends); 
router.get('/filtered', getFilteredExpenses); 
router.get('/monthly-income', getMonthlyIncome);

module.exports = router;
