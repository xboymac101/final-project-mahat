function isAuthenticated(req, res, next) {
  if (!req.session.user_id) {
    return res.status(401).json({ message: 'Not logged in' });
  }
  next();
}

function isAdmin(req, res, next) {
  if (req.session.role !== 'Admin') {
    return res.status(403).json({ message: 'Admins only' });
  }
  next();
}

module.exports = { isAuthenticated, isAdmin };
    