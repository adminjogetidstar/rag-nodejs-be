export default function roleAuth(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user;

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ success: false, message: "This role is can't access this route" });
    }

    next();
  };
}
