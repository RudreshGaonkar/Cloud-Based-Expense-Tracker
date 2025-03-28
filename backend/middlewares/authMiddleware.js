// middleware/authMiddleware.js

function authMiddleware(req, res, next) {
  if (req.session && req.session.userId) {
      // User is authenticated
      next();
  } else {
      // User is not authenticated
      return res.status(401).json({ message: 'Unauthorized, session expired or missing' });
  }
}

module.exports = authMiddleware;