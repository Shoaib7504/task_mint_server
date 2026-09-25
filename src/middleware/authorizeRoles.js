/**
 * Role-based authorization middleware.
 * Must be used AFTER authMiddleware so req.user is populated.
 * @param  {...string} roles - Allowed roles (e.g. "BUYER", "ADMIN")
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
};
