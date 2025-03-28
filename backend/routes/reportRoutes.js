const express = require('express');
const router = express.Router();
const { 
    getExpenseSummary, 
    getCategoryReport, 
    getMonthlyTrends, 
    getExpenseTrends,  
    getFilteredExpenses 
} = require('../controllers/reportController');


router.get('/summary', getExpenseSummary);
router.get('/categories', getCategoryReport);
router.get('/monthly', getMonthlyTrends);
router.get('/trends', getExpenseTrends); 
router.get('/filtered', getFilteredExpenses); 

module.exports = router;
