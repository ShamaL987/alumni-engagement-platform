const User = require('../models/user.model');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');
const { addToBlacklist } = require('../utils/blacklist');
const crypto = require('crypto');

// 1. REGISTER
exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate university email
        if (!email.endsWith('@westminster.ac.uk')) {
            return res.status(400).json({ message: 'Use university email' });
        }

        // 2. Strong password
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password too short' });
        }

        // 3. Check duplicate
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // 4. Hash password
        const hashed = await hashPassword(password);

        // 5. Generate verification token
        const token = crypto.randomBytes(32).toString('hex');

        // 6. Create user
        const user = await User.create({
            email,
            password: hashed,
            verificationToken: token
        });

        res.json({
            message: 'Registered. Verify email.',
            verificationToken: token // simulate email
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ where: { verificationToken: token } });

        if (!user) return res.status(400).json({ message: 'Invalid token' });

        user.isVerified = true;
        user.verificationToken = null;
        await user.save();

        res.json({ message: 'Email verified' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });

        if (!user) return res.status(400).json({ message: 'User not found' });

        if (!user.isVerified) {
            return res.status(400).json({ message: 'Verify email first' });
        }

        const match = await comparePassword(password, user.password);
        if (!match) return res.status(400).json({ message: 'Wrong password' });

        const token = generateToken(user);

        res.json({ message: 'Login successful', token });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    await user.save();

    res.json({
        message: 'Reset token generated',
        resetToken: token
    });
};

// 5. RESET PASSWORD
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({ where: { resetToken: token } });
    if (!user) return res.status(400).json({ message: 'Invalid token' });

    user.password = await hashPassword(newPassword);
    user.resetToken = null;

    await user.save();

    res.json({ message: 'Password updated' });
};

exports.logout = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(400).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        // ✅ Add token to blacklist
        addToBlacklist(token);

        res.json({ message: 'Logged out successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};