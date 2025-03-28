const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/session', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "No active session. Please log in." });
    }
    res.json({ message: "Session refreshed", user: req.session.user });
});

// Route for user registration
router.post('/register', userController.register);

// Route for user login
router.post('/login', userController.login);

// Route for user logout
router.post('/logout',userController.logout);

// Route to get the user's profile
router.get('/profile', userController.getProfile);
router.post('/change-password', userController.changePassword);

module.exports = router;
