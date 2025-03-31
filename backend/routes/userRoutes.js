const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/session', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "No active session. Please log in." });
    }
    res.json({ message: "Session refreshed", user: req.session.user });
});

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/google-login', userController.googleLogin);
router.post('/logout', userController.logout);


router.get('/profile', userController.getProfile);
router.post('/update-profile', userController.updateProfile);
router.post('/change-password', userController.changePassword);

module.exports = router;