const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');

router.get('/summary', incomeController.getIncomeSummary);
router.post('/add', incomeController.addIncome);
router.put('/update/:id', incomeController.updateIncome);
router.delete('/delete/:id', incomeController.deleteIncome);
router.get("/total", incomeController.getTotalIncome);
router.get("/records", incomeController.getIncomeRecords);

module.exports = router;