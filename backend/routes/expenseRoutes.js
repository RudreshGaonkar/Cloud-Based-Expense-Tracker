const express = require('express');
const router = express.Router();
const { addExpense, getPaginatedExpenses, deleteExpense , updateExpense} = require('../controllers/expenseController'); 

router.post('/', addExpense); 
router.get('/:userId', getPaginatedExpenses); 
router.delete('/:id', deleteExpense);
router.put('/:id', updateExpense);

module.exports = router;
