const express = require('express');
const router = express.Router();
const { addExpense, getPaginatedExpenses, deleteExpense , updateExpense} = require('../controllers/expenseController'); 

router.post('/', addExpense);  // ✅ POST /api/expenses
router.get('/:userId', getPaginatedExpenses); // ✅ GET /api/expenses/:userId
router.delete('/:id', deleteExpense); // ✅ DELETE /api/expenses/:id
router.put('/:id', updateExpense);

module.exports = router;
