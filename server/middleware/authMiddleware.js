const { verifyAccessToken } = require('../utils/tokenUtils');
const User = require('../models/User');

// Protect routes - verify JWT
const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        // Verify token
        const decoded = verifyAccessToken(token);

        // Get user from token
        const user = await User.findById(decoded.id).select('-password -refreshToken');
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token invalid' });
    }
};

// Authorize by role
const authorize = (...roles) => {
    return (req, res, next) => {
        console.log(`Authorize: User role '${req.user.role}' vs required roles [${roles}]`);
        if (!roles.includes(req.user.role)) {
            console.log('Authorize: Access Denied');
            return res.status(403).json({
                message: `Role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
