const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');

// @desc    Register Student
// @route   POST /api/auth/signup/student
const registerStudent = async (req, res) => {
    try {
        const { email, password, hostel, block, roomNumber } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create student user
        const user = await User.create({
            email,
            password,
            role: 'student',
            hostel,
            block,
            roomNumber
        });

        // Generate tokens
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id, user.role);

        // Save refresh token to database
        user.refreshToken = refreshToken;
        await user.save();

        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            message: 'Student registered successfully',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                hostel: user.hostel,
                block: user.block,
                roomNumber: user.roomNumber
            },
            accessToken
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register Management
// @route   POST /api/auth/signup/management
const registerManagement = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create management user (isApproved defaults to false)
        const user = await User.create({
            email,
            password,
            role: 'management'
        });

        res.status(201).json({
            message: 'Management account created. Awaiting approval.',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login Student
// @route   POST /api/auth/login/student
const loginStudent = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email, role: 'student' });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id, user.role);

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        // Set refresh token cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                hostel: user.hostel,
                block: user.block,
                roomNumber: user.roomNumber
            },
            accessToken
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login Management
// @route   POST /api/auth/login/management
const loginManagement = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email, role: 'management' });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if approved
        if (!user.isApproved) {
            return res.status(403).json({ message: 'Account pending approval' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id, user.role);

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        // Set refresh token cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        console.log('Sending user data on login:', {
            email: user.email,
            managementRole: user.managementRole,
            isAdmin: user.isAdmin
        });

        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved,
                isAdmin: user.isAdmin,
                managementRole: user.managementRole,
                staffSpecialization: user.staffSpecialization
            },
            accessToken
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh-token
const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;

        if (!token) {
            return res.status(401).json({ message: 'No refresh token provided' });
        }

        // Verify token
        const decoded = verifyRefreshToken(token);

        // Find user with this refresh token
        const user = await User.findOne({ _id: decoded.id, refreshToken: token });
        if (!user) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        // Generate new access token
        const accessToken = generateAccessToken(user._id, user.role);

        res.json({ accessToken });
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
};

// @desc    Logout
// @route   POST /api/auth/logout
const logout = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;

        if (token) {
            // Clear refresh token from database
            await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: null });
        }

        // Clear cookie
        res.clearCookie('refreshToken');
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -refreshToken');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerStudent,
    registerManagement,
    loginStudent,
    loginManagement,
    refreshToken,
    logout,
    getMe
};
