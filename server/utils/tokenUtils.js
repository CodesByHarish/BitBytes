const jwt = require('jsonwebtoken');

// Generate Access Token (15 minutes)
const generateAccessToken = (userId, role) => {
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
    );
};

// Generate Refresh Token (7 days)
const generateRefreshToken = (userId, role) => {
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
};

// Verify Access Token
const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

// Verify Refresh Token
const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
};
