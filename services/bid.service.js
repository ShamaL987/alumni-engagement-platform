const { Op } = require('sequelize');
const { Bid, Profile, User } = require('../models');

const getMonthRange = (dateString) => {
  const date = new Date(dateString);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
};

const getAllowedWinsForDate = async (userId) => {
  const profile = await Profile.findOne({ where: { userId } });
  const bonus = profile ? Math.min(profile.monthlyEventBonusCount, 1) : 0;
  return 3 + bonus;
};

const getWinCountForMonth = async (userId, targetDate) => {
  const { start, end } = getMonthRange(targetDate);
  return Bid.count({
    where: {
      userId,
      status: 'won',
      targetDate: {
        [Op.between]: [start, end]
      }
    }
  });
};

const ensureEligibleToBid = async (userId, targetDate) => {
  const allowedWins = await getAllowedWinsForDate(userId);
  const currentWins = await getWinCountForMonth(userId, targetDate);
  if (currentWins >= allowedWins) {
    const error = new Error('Monthly featured limit reached for this alumnus');
    error.statusCode = 400;
    throw error;
  }
  return { allowedWins, currentWins, remainingSlots: allowedWins - currentWins };
};

const getCurrentHighestActiveBid = async (targetDate) => {
  return Bid.findOne({
    where: {
      targetDate,
      status: 'active'
    },
    order: [['bidAmount', 'DESC'], ['createdAt', 'ASC']]
  });
};

const getBlindStatus = async (bid) => {
  const highestBid = await getCurrentHighestActiveBid(bid.targetDate);
  if (!highestBid) {
    return 'losing';
  }

  return Number(highestBid.id) === Number(bid.id) ? 'winning' : 'losing';
};

const placeBid = async (userId, { bidAmount, targetDate }) => {
  if (!targetDate) {
    const error = new Error('targetDate is required');
    error.statusCode = 400;
    throw error;
  }

  if (!bidAmount || Number(bidAmount) <= 0) {
    const error = new Error('bidAmount must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  const today = new Date().toISOString().slice(0, 10);
  if (targetDate < today) {
    const error = new Error('targetDate must be today or a future date');
    error.statusCode = 400;
    throw error;
  }

  const existingBid = await Bid.findOne({ where: { userId, targetDate, status: { [Op.ne]: 'cancelled' } } });
  if (existingBid) {
    const error = new Error('A bid already exists for this date. Use update instead.');
    error.statusCode = 409;
    throw error;
  }

  const limitStatus = await ensureEligibleToBid(userId, targetDate);
  const bid = await Bid.create({ userId, targetDate, bidAmount: Number(bidAmount), status: 'active' });
  const blindStatus = await getBlindStatus(bid);

  return {
    bid,
    feedback: blindStatus,
    remainingSlots: limitStatus.remainingSlots
  };
};

const updateBid = async (userId, bidId, { bidAmount }) => {
  const bid = await Bid.findOne({ where: { id: bidId, userId } });
  if (!bid) {
    const error = new Error('Bid not found');
    error.statusCode = 404;
    throw error;
  }

  if (bid.status !== 'active') {
    const error = new Error('Only active bids can be updated');
    error.statusCode = 400;
    throw error;
  }

  if (!bidAmount || Number(bidAmount) <= Number(bid.bidAmount)) {
    const error = new Error('Bid amount must be greater than the current bid amount');
    error.statusCode = 400;
    throw error;
  }

  bid.bidAmount = Number(bidAmount);
  await bid.save();

  const blindStatus = await getBlindStatus(bid);
  return {
    bid,
    feedback: blindStatus
  };
};

const cancelBid = async (userId, bidId) => {
  const bid = await Bid.findOne({ where: { id: bidId, userId } });
  if (!bid) {
    const error = new Error('Bid not found');
    error.statusCode = 404;
    throw error;
  }

  if (bid.status !== 'active') {
    const error = new Error('Only active bids can be cancelled');
    error.statusCode = 400;
    throw error;
  }

  bid.status = 'cancelled';
  await bid.save();
  return true;
};

const listOwnBids = async (userId) => {
  const bids = await Bid.findAll({ where: { userId }, order: [['targetDate', 'DESC'], ['createdAt', 'DESC']] });
  const results = [];

  for (const bid of bids) {
    results.push({
      ...bid.toJSON(),
      blindStatus: bid.status === 'active' ? await getBlindStatus(bid) : bid.status
    });
  }

  return results;
};

const getMyBidStatusForDate = async (userId, targetDate) => {
  const bid = await Bid.findOne({ where: { userId, targetDate } });
  if (!bid) {
    const error = new Error('Bid not found for the supplied date');
    error.statusCode = 404;
    throw error;
  }

  const allowedWins = await getAllowedWinsForDate(userId);
  const currentWins = await getWinCountForMonth(userId, targetDate);

  return {
    bid,
    blindStatus: bid.status === 'active' ? await getBlindStatus(bid) : bid.status,
    remainingSlots: allowedWins - currentWins
  };
};

const processWinnerSelectionForDate = async (targetDate) => {
  const activeBids = await Bid.findAll({
    where: { targetDate, status: 'active' },
    order: [['bidAmount', 'DESC'], ['createdAt', 'ASC']]
  });

  if (activeBids.length === 0) {
    return null;
  }

  const winner = activeBids[0];
  winner.status = 'won';
  winner.selectedAt = new Date();
  await winner.save();

  for (const losingBid of activeBids.slice(1)) {
    losingBid.status = 'lost';
    losingBid.selectedAt = new Date();
    await losingBid.save();
  }

  return winner;
};

const getFeaturedAlumnusForDate = async (dateString) => {
  const winningBid = await Bid.findOne({
    where: {
      targetDate: dateString,
      status: 'won'
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email'],
        include: [
          {
            model: Profile,
            as: 'profile'
          }
        ]
      }
    ]
  });

  return winningBid;
};

module.exports = {
  placeBid,
  updateBid,
  cancelBid,
  listOwnBids,
  getMyBidStatusForDate,
  processWinnerSelectionForDate,
  getFeaturedAlumnusForDate
};
