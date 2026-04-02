const { Op, Transaction } = require('sequelize');
const sequelize = require('../config/db');
const { Bid, BidHistory, BiddingCycle, Profile, User } = require('../models');

const CYCLE_CLOSE_HOUR = Number(process.env.BIDDING_CLOSE_HOUR || 18);
const MANUAL_CYCLE_PROCESSING_ENABLED = process.env.ENABLE_MANUAL_CYCLE_PROCESSING !== 'false';

const toDateOnly = (date) => date.toISOString().slice(0, 10);

const getNextCycleEndTime = (referenceDate = new Date()) => {
  const cycleEndTime = new Date(referenceDate);
  cycleEndTime.setHours(CYCLE_CLOSE_HOUR, 0, 0, 0);

  if (referenceDate >= cycleEndTime) {
    cycleEndTime.setDate(cycleEndTime.getDate() + 1);
  }

  return cycleEndTime;
};

const getFeaturedDateForCycleEnd = (cycleEndTime) => {
  const featuredDate = new Date(cycleEndTime);
  featuredDate.setDate(featuredDate.getDate() + 1);
  return toDateOnly(featuredDate);
};

const getMonthRange = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    start: toDateOnly(startOfMonth),
    end: toDateOnly(endOfMonth)
  };
};

const getAllowedWinsForFeaturedMonth = async (userId) => {
  const profile = await Profile.findOne({ where: { userId } });
  const eventBonusCount = profile ? Math.min(Number(profile.monthlyEventBonusCount || 0), 1) : 0;
  return 3 + eventBonusCount;
};

const getWinCountForFeaturedMonth = async (userId, featuredDate, transaction) => {
  const { start, end } = getMonthRange(featuredDate);

  return BiddingCycle.count({
    where: {
      winnerUserId: userId,
      status: 'processed',
      featuredDate: {
        [Op.between]: [start, end]
      }
    },
    transaction
  });
};

const ensureEligibleToBidForCycle = async (userId, cycle, transaction) => {
  const allowedWins = await getAllowedWinsForFeaturedMonth(userId);
  const currentWins = await getWinCountForFeaturedMonth(userId, cycle.featuredDate, transaction);

  if (currentWins >= allowedWins) {
    const error = new Error('Monthly featured limit reached for this alumnus');
    error.statusCode = 400;
    throw error;
  }

  return {
    allowedWins,
    currentWins,
    remainingSlots: allowedWins - currentWins
  };
};

const getHighestActiveBidForCycle = async (cycleId, transaction) => {
  return Bid.findOne({
    where: {
      cycleId,
      status: 'active'
    },
    order: [['bidAmount', 'DESC'], ['createdAt', 'ASC']],
    transaction
  });
};

const getBlindStatusForBid = async (bid, transaction) => {
  const highestActiveBid = await getHighestActiveBidForCycle(bid.cycleId, transaction);

  if (!highestActiveBid) {
    return 'losing';
  }

  return Number(highestActiveBid.id) === Number(bid.id) ? 'winning' : 'losing';
};

const createCycle = async (startTime = new Date(), transaction) => {
  const cycleEndTime = getNextCycleEndTime(startTime);
  const featuredDate = getFeaturedDateForCycleEnd(cycleEndTime);

  return BiddingCycle.create(
      {
        startTime,
        endTime: cycleEndTime,
        featuredDate,
        status: 'active'
      },
      { transaction }
  );
};

const ensureActiveCycle = async () => {
  await processDueCycles();

  const currentActiveCycle = await BiddingCycle.findOne({
    where: {
      status: 'active',
      endTime: { [Op.gt]: new Date() }
    },
    order: [['startTime', 'DESC']]
  });

  if (currentActiveCycle) {
    return currentActiveCycle;
  }

  return sequelize.transaction(async (transaction) => {
    const existingActiveCycle = await BiddingCycle.findOne({
      where: {
        status: 'active',
        endTime: { [Op.gt]: new Date() }
      },
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (existingActiveCycle) {
      return existingActiveCycle;
    }

    return createCycle(new Date(), transaction);
  });
};

const getCurrentCycle = async () => {
  const cycle = await ensureActiveCycle();
  const highestActiveBid = await getHighestActiveBidForCycle(cycle.id);

  return {
    ...cycle.toJSON(),
    isOpen: new Date(cycle.endTime) > new Date(),
    currentStatus: 'active',
    highestBidVisible: false,
    currentLeadingBidExists: Boolean(highestActiveBid)
  };
};

const createHistoryEntry = async (payload, transaction) => {
  return BidHistory.create(payload, { transaction });
};

const placeBid = async (userId, { bidAmount }) => {
  if (!bidAmount || Number(bidAmount) <= 0) {
    const error = new Error('bidAmount must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  const activeCycle = await ensureActiveCycle();

  return sequelize.transaction(async (transaction) => {
    const lockedCycle = await BiddingCycle.findByPk(activeCycle.id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!lockedCycle || lockedCycle.status !== 'active' || new Date(lockedCycle.endTime) <= new Date()) {
      const error = new Error('No active bidding cycle is available right now');
      error.statusCode = 400;
      throw error;
    }

    const existingBid = await Bid.findOne({
      where: { userId, cycleId: lockedCycle.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (existingBid && existingBid.status !== 'cancelled') {
      const error = new Error('A bid already exists for the current cycle. Use update instead.');
      error.statusCode = 409;
      throw error;
    }

    const limitStatus = await ensureEligibleToBidForCycle(userId, lockedCycle, transaction);
    const bid = await Bid.create(
        {
          userId,
          cycleId: lockedCycle.id,
          bidAmount: Number(bidAmount),
          status: 'active'
        },
        { transaction }
    );

    await createHistoryEntry(
        {
          cycleId: lockedCycle.id,
          bidId: bid.id,
          userId,
          action: 'created',
          previousAmount: null,
          newAmount: Number(bidAmount),
          note: 'Bid created for active cycle'
        },
        transaction
    );

    const feedback = await getBlindStatusForBid(bid, transaction);

    return {
      cycle: lockedCycle,
      bid,
      feedback,
      remainingSlots: limitStatus.remainingSlots
    };
  });
};

const updateBid = async (userId, bidId, { bidAmount }) => {
  if (!bidAmount || Number(bidAmount) <= 0) {
    const error = new Error('bidAmount must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  return sequelize.transaction(async (transaction) => {
    const bid = await Bid.findOne({
      where: { id: bidId, userId },
      include: [{ model: BiddingCycle, as: 'cycle' }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

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

    if (!bid.cycle || bid.cycle.status !== 'active' || new Date(bid.cycle.endTime) <= new Date()) {
      const error = new Error('The bidding cycle is closed. This bid can no longer be updated.');
      error.statusCode = 400;
      throw error;
    }

    if (Number(bidAmount) <= Number(bid.bidAmount)) {
      const error = new Error('Bid amount must be greater than the current bid amount');
      error.statusCode = 400;
      throw error;
    }

    const previousAmount = Number(bid.bidAmount);
    bid.bidAmount = Number(bidAmount);
    await bid.save({ transaction });

    await createHistoryEntry(
        {
          cycleId: bid.cycleId,
          bidId: bid.id,
          userId,
          action: 'increased',
          previousAmount,
          newAmount: Number(bidAmount),
          note: 'Bid increased'
        },
        transaction
    );

    const feedback = await getBlindStatusForBid(bid, transaction);

    return {
      cycle: bid.cycle,
      bid,
      feedback
    };
  });
};

const cancelBid = async (userId, bidId) => {
  return sequelize.transaction(async (transaction) => {
    const bid = await Bid.findOne({
      where: { id: bidId, userId },
      include: [{ model: BiddingCycle, as: 'cycle' }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

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

    if (!bid.cycle || bid.cycle.status !== 'active' || new Date(bid.cycle.endTime) <= new Date()) {
      const error = new Error('The bidding cycle is closed. This bid can no longer be cancelled.');
      error.statusCode = 400;
      throw error;
    }

    const previousAmount = Number(bid.bidAmount);
    bid.status = 'cancelled';
    await bid.save({ transaction });

    await createHistoryEntry(
        {
          cycleId: bid.cycleId,
          bidId: bid.id,
          userId,
          action: 'cancelled',
          previousAmount,
          newAmount: previousAmount,
          note: 'Bid cancelled by user'
        },
        transaction
    );

    return true;
  });
};

const listOwnBids = async (userId) => {
  const bids = await Bid.findAll({
    where: { userId },
    include: [{ model: BiddingCycle, as: 'cycle' }],
    order: [['createdAt', 'DESC']]
  });

  const bidSummaries = [];

  for (const bid of bids) {
    bidSummaries.push({
      ...bid.toJSON(),
      blindStatus: bid.status === 'active' ? await getBlindStatusForBid(bid) : bid.status
    });
  }

  return bidSummaries;
};

const getMyCurrentBidStatus = async (userId) => {
  const activeCycle = await ensureActiveCycle();
  const bid = await Bid.findOne({ where: { userId, cycleId: activeCycle.id } });

  if (!bid) {
    const limitStatus = await ensureEligibleToBidForCycle(userId, activeCycle);

    return {
      cycle: activeCycle,
      bid: null,
      blindStatus: 'not_placed',
      remainingSlots: limitStatus.remainingSlots
    };
  }

  const allowedWins = await getAllowedWinsForFeaturedMonth(userId);
  const currentWins = await getWinCountForFeaturedMonth(userId, activeCycle.featuredDate);

  return {
    cycle: activeCycle,
    bid,
    blindStatus: bid.status === 'active' ? await getBlindStatusForBid(bid) : bid.status,
    remainingSlots: allowedWins - currentWins
  };
};

const markLosingBids = async (bids, transaction) => {
  for (const losingBid of bids) {
    losingBid.status = 'lost';
    losingBid.selectedAt = new Date();
    await losingBid.save({ transaction });

    await createHistoryEntry(
        {
          cycleId: losingBid.cycleId,
          bidId: losingBid.id,
          userId: losingBid.userId,
          action: 'lost',
          previousAmount: Number(losingBid.bidAmount),
          newAmount: Number(losingBid.bidAmount),
          note: 'Bid lost during cycle processing'
        },
        transaction
    );
  }
};

const processCycleById = async (cycleId, options = {}) => {
  const { force = false } = options;

  return sequelize.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
      },
      async (transaction) => {
        const cycle = await BiddingCycle.findByPk(cycleId, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        if (!cycle) {
          const error = new Error('Bidding cycle not found');
          error.statusCode = 404;
          throw error;
        }

        if (cycle.status === 'processed') {
          return cycle;
        }

        if (!force && new Date(cycle.endTime) > new Date()) {
          const error = new Error('This cycle is still active and cannot be processed yet');
          error.statusCode = 400;
          throw error;
        }

        cycle.status = 'processing';
        await cycle.save({ transaction });

        const activeBids = await Bid.findAll({
          where: { cycleId: cycle.id, status: 'active' },
          order: [['bidAmount', 'DESC'], ['createdAt', 'ASC']],
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        let winnerBid = null;

        for (const candidateBid of activeBids) {
          const allowedWins = await getAllowedWinsForFeaturedMonth(candidateBid.userId);
          const currentWins = await getWinCountForFeaturedMonth(candidateBid.userId, cycle.featuredDate, transaction);

          if (currentWins < allowedWins) {
            winnerBid = candidateBid;
            break;
          }
        }

        if (winnerBid) {
          winnerBid.status = 'won';
          winnerBid.selectedAt = new Date();
          await winnerBid.save({ transaction });

          await createHistoryEntry(
              {
                cycleId: cycle.id,
                bidId: winnerBid.id,
                userId: winnerBid.userId,
                action: 'won',
                previousAmount: Number(winnerBid.bidAmount),
                newAmount: Number(winnerBid.bidAmount),
                note: 'Bid won cycle processing'
              },
              transaction
          );

          const losingBids = activeBids.filter((bid) => Number(bid.id) !== Number(winnerBid.id));
          await markLosingBids(losingBids, transaction);

          cycle.winnerBidId = winnerBid.id;
          cycle.winnerUserId = winnerBid.userId;
        } else {
          await markLosingBids(activeBids, transaction);

          await createHistoryEntry(
              {
                cycleId: cycle.id,
                bidId: null,
                userId: null,
                action: 'cycle_processed_no_winner',
                previousAmount: null,
                newAmount: null,
                note: 'Cycle processed without an eligible winning bid'
              },
              transaction
          );
        }

        cycle.status = 'processed';
        cycle.processedAt = new Date();
        await cycle.save({ transaction });

        return cycle;
      }
  );
};

const processDueCycles = async () => {
  const dueCycles = await BiddingCycle.findAll({
    where: {
      status: 'active',
      endTime: { [Op.lte]: new Date() }
    },
    order: [['endTime', 'ASC']]
  });

  for (const dueCycle of dueCycles) {
    await processCycleById(dueCycle.id, { force: true });
  }

  const activeCycle = await BiddingCycle.findOne({
    where: {
      status: 'active',
      endTime: { [Op.gt]: new Date() }
    }
  });

  if (!activeCycle) {
    await createCycle(new Date());
  }
};

const getCycleHistory = async ({ limit = 25 } = {}) => {
  return BiddingCycle.findAll({
    include: [
      {
        model: Bid,
        as: 'bids',
        include: [{ model: User, as: 'user', attributes: ['id', 'email'] }]
      },
      {
        model: BidHistory,
        as: 'historyEntries',
        include: [{ model: User, as: 'user', attributes: ['id', 'email'], required: false }]
      },
      {
        model: User,
        as: 'winnerUser',
        attributes: ['id', 'email'],
        required: false,
        include: [{ model: Profile, as: 'profile', required: false }]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: Number(limit)
  });
};

const getCycleHistoryById = async (cycleId) => {
  const cycle = await BiddingCycle.findByPk(cycleId, {
    include: [
      {
        model: Bid,
        as: 'bids',
        include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        order: [['bidAmount', 'DESC']]
      },
      {
        model: BidHistory,
        as: 'historyEntries',
        include: [{ model: User, as: 'user', attributes: ['id', 'email'], required: false }]
      },
      {
        model: User,
        as: 'winnerUser',
        attributes: ['id', 'email'],
        required: false,
        include: [{ model: Profile, as: 'profile', required: false }]
      },
      {
        model: Bid,
        as: 'winnerBid',
        required: false
      }
    ]
  });

  if (!cycle) {
    const error = new Error('Bidding cycle not found');
    error.statusCode = 404;
    throw error;
  }

  return cycle;
};

const getFeaturedAlumnusForDate = async (dateString) => {
  const cycle = await BiddingCycle.findOne({
    where: {
      featuredDate: dateString,
      status: 'processed'
    },
    include: [
      {
        model: User,
        as: 'winnerUser',
        attributes: ['id', 'email'],
        required: false,
        include: [{ model: Profile, as: 'profile', required: false }]
      },
      {
        model: Bid,
        as: 'winnerBid',
        required: false
      }
    ]
  });

  return cycle;
};

const processCurrentCycle = async () => {
  if (!MANUAL_CYCLE_PROCESSING_ENABLED) {
    const error = new Error('Manual cycle processing is disabled');
    error.statusCode = 403;
    throw error;
  }

  const activeCycle = await ensureActiveCycle();
  const processedCycle = await processCycleById(activeCycle.id, { force: true });
  await ensureActiveCycle();
  return processedCycle;
};

module.exports = {
  ensureActiveCycle,
  getCurrentCycle,
  placeBid,
  updateBid,
  cancelBid,
  listOwnBids,
  getMyCurrentBidStatus,
  processDueCycles,
  processCurrentCycle,
  getCycleHistory,
  getCycleHistoryById,
  getFeaturedAlumnusForDate
};
