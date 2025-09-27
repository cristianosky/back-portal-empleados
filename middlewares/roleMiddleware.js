// middlewares/roleMiddleware.js
module.exports = (roles = []) => {
  // Si pasan un string, conviértelo a array
  if (typeof roles === 'string') roles = [roles];

  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ msg: 'No autorizado' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'No tienes permisos' });
    }
    next();
  };
};
