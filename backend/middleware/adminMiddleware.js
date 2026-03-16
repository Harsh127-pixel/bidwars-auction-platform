const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access Denied: Administrative privileges required"
    });
  }
  next();
};

module.exports = isAdmin;
