const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');

class AuthService {

    static async register(data) {
        const { email, password } = data;

        // ✅ Domain validation
        if (!email.endsWith('@westminster.ac.uk')) {
            throw new Error('Invalid university email');
        }

        // ✅ Check existing user
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('User already exists');
        }

        // ✅ Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Generate verification token
        const token = crypto.randomBytes(32).toString('hex');

        const user = await User.create({
            email,
            password: hashedPassword,
            verificationToken: token
        });

        return {
            message: "User registered. Verify email.",
            token
        };
    }

    static async verifyEmail(token) {
        const user = await User.findOne({ where: { verificationToken: token } });

        if (!user) throw new Error('Invalid token');

        user.isVerified = true;
        user.verificationToken = null;
        await user.save();

        return { message: "Email verified successfully" };
    }

    static async login(data) {
        const { email, password } = data;

        const user = await User.findOne({ where: { email } });

        if (!user) throw new Error('User not found');
        if (!user.isVerified) throw new Error('Email not verified');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error('Invalid credentials');

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        return { token };
    }

    static async forgotPassword(email) {
        const user = await User.findOne({ where: { email } });

        if (!user) throw new Error('User not found');

        const token = crypto.randomBytes(32).toString('hex');

        user.resetToken = token;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
        await user.save();

        return { message: "Reset token generated", token };
    }

    static async resetPassword(token, newPassword) {
        const user = await User.findOne({
            where: {
                resetToken: token
            }
        });

        if (!user || user.resetTokenExpiry < Date.now()) {
            throw new Error('Invalid or expired token');
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = null;
        user.resetTokenExpiry = null;

        await user.save();

        return { message: "Password reset successful" };
    }
}

module.exports = AuthService;
