const express = require('express');
const router = express.Router();
const { fetchCategories } = require('../controllers/categoryController');

router.get('/', fetchCategories);

module.exports = router;
