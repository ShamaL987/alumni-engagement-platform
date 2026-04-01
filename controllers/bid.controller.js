const Bid = require('../models/bid.model');
const { Op } = require('sequelize');
const { sendEmail } = require('../services/email.service');

// PLACE BID (Blind + Validation + Monthly Limit)
exports.placeBid = async (req, res) => {
    try {
        const { amount } = req.body;

        // ❌ validation
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid bid amount' });
        }

        // ✅ monthly win count
        const count = await Bid.count({
            where: {
                userId: req.user.id,
                status: 'won',
                createdAt: {
                    [Op.gte]: new Date(new Date().setDate(1))
                }
            }
        });

        if (count >= 3) {
            return res.status(400).json({
                message: 'Monthly win limit reached',
                remaining: 0
            });
        }

        // ✅ place bid
        const bid = await Bid.create({
            userId: req.user.id,
            amount
        });

        // ✅ email feedback
        sendEmail(
            req.user.email,
            'Bid Placed',
            `Your bid of ${amount} has been placed`
        );

        res.json({
            message: 'Bid placed successfully',
            remaining: 3 - count
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE BID (increase only)
exports.updateBid = async (req, res) => {
    const { amount } = req.body;

    const bid = await Bid.findOne({ where: { userId: req.user.id } });

    if (!bid) return res.status(404).json({ message: 'No bid found' });

    if (amount <= bid.amount) {
        return res.status(400).json({
            message: 'You can only increase your bid'
        });
    }

    bid.amount = amount;
    await bid.save();

    res.json({ message: 'Bid updated', bid });
};

// STATUS (Blind feedback)
exports.getBidStatus = async (req, res) => {
    const highestBid = await Bid.max('amount');

    const userBid = await Bid.findOne({ where: { userId: req.user.id } });

    if (!userBid) return res.status(404).json({ message: 'No bid found' });

    const status = userBid.amount === highestBid ? 'winning' : 'losing';

    res.json({ status });
};