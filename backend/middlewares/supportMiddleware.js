const supportRoleMiddleware = (req, res, next) => {
    // Check if user is authenticated and has admin role
    if (req.user && req.user.role === "support") {
        next(); // allow access
    } else {
        return res.status(403).json({
            success: false,
            message: "Forbidden: Customer Support only",
        });
    }
};

module.exports = supportRoleMiddleware;
