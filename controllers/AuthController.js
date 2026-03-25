const AuthService = require('../services/AuthService');

class AuthController {

    static async register(req, res) {
        try {
            const result = await AuthService.register(req.body);
            res.status(201).json(result);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async verifyEmail(req, res) {
        try {
            const result = await AuthService.verifyEmail(req.body.token);
            res.json(result);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async login(req, res) {
        try {
            const result = await AuthService.login(req.body);
            res.json(result);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async forgotPassword(req, res) {
        try {
            const result = await AuthService.forgotPassword(req.body.email);
            res.json(result);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async resetPassword(req, res) {
        try {
            const result = await AuthService.resetPassword(
                req.body.token,
                req.body.newPassword
            );
            res.json(result);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async logout(req, res) {
        res.json({ message: "Logged out successfully" });
    }
}

module.exports = AuthController;
