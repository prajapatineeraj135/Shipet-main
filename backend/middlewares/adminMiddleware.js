const adminMiddleware = (req, res, next) => {
    // Check if user is authenticated and has admin role
    if (req.user && req.user.role === "admin") {
        next(); // allow access
    } else {
        return res.status(403).json({
            success: false,
            message: "Forbidden: Admins only",
        });
    }
};

module.exports = adminMiddleware;
