const { Op, Transaction } = require('sequelize');
const sequelize = require('../config/db');
const { Bid, BidHistory, BiddingCycle, Profile, User } = require('../models');
const {
  sendWinnerSelectedEmail,
  sendBidUpdatedEmail,
  sendBidPlacedEmail
} = require('./mail.service');

const CYCLE_CLOSE_HOUR = Number(process.env.BIDDING_CLOSE_HOUR || 18);
const MANUAL_CYCLE_PROCESSING_ENABLED = process.env.ENABLE_MANUAL_CYCLE_PROCESSING !== 'false';

const BASE_BID_SLOT_LIMIT = 3;
const BASE_MONTHLY_WIN_LIMIT = 3;
const MAX_EVENT_BONUS = 1;

const toDateOnly = (date) => date.toISOString().slice(0, 10);

const getNextCycleEndTime = (startTime = new Date()) => {
  const endTime = new Date(startTime);
  endTime.setDate(endTime.getDate() + 1);
  endTime.setHours(CYCLE_CLOSE_HOUR, 0, 0, 0);
  return endTime;
};

const getFeaturedDateForCycleEnd = (cycleEndTime) => {
  const featuredDate = new Date(cycleEndTime);
  featuredDate.setDate(featuredDate.getDate() + 1);
  return toDateOnly(featuredDate);
};

const getMonthRange = (date) => {
  const baseDate = new Date(date);

  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getAllowedBidSlots = async (userId) => {
  const profile = await Profile.findOne({ where: { userId } });
  const monthlyEventBonusCount = profile ? Number(profile.monthlyEventBonusCount || 0) : 0;
  const eventBonus = Math.min(monthlyEventBonusCount, MAX_EVENT_BONUS);

  return BASE_BID_SLOT_LIMIT + eventBonus;
};

const getAllowedMonthlyWinSlots = async () => {
  return BASE_MONTHLY_WIN_LIMIT;
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

const ensureMonthlyWinEligibilityForCycle = async (userId, cycle, transaction) => {
  const allowedWinSlots = await getAllowedMonthlyWinSlots();
  const currentWins = await getWinCountForFeaturedMonth(
      userId,
      cycle.featuredDate,
      transaction
  );

  if (currentWins >= allowedWinSlots) {
    const error = new Error('Monthly Alumni of the Day win limit reached');
    error.statusCode = 400;
    throw error;
  }

  return {
    allowedWinSlots,
    currentWins,
    remainingWinSlots: allowedWinSlots - currentWins
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

const createHistoryEntry = async (payload, transaction) => {
  return BidHistory.create(payload, { transaction });
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

const placeBid = async (userId, { bidAmount }) => {
  if (!bidAmount || Number(bidAmount) <= 0) {
    const error = new Error('bidAmount must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  const activeCycle = await ensureActiveCycle();

  const result = await sequelize.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
      },
      async (transaction) => {
        const lockedCycle = await BiddingCycle.findByPk(activeCycle.id, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        if (!lockedCycle || lockedCycle.status !== 'active' || new Date(lockedCycle.endTime) <= new Date()) {
          const error = new Error('No active bidding cycle is available right now');
          error.statusCode = 400;
          throw error;
        }

        const winEligibility = await ensureMonthlyWinEligibilityForCycle(
            userId,
            lockedCycle,
            transaction
        );

        const allowedBidSlots = await getAllowedBidSlots(userId);

        const existingBid = await Bid.findOne({
          where: {
            userId,
            cycleId: lockedCycle.id
          },
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        if (existingBid && existingBid.status !== 'cancelled') {
          const error = new Error('A bid already exists for the current cycle. Use update instead.');
          error.statusCode = 409;
          throw error;
        }

        const bid = await Bid.create(
            {
              userId,
              cycleId: lockedCycle.id,
              bidAmount: Number(bidAmount),
              status: 'active',
              bidAttemptCount: 1
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
          allowedBidSlots,
          allowedWinSlots: winEligibility.allowedWinSlots,
          currentBids: bid.bidAttemptCount,
          currentWins: winEligibility.currentWins,
          remainingBidSlots: Math.max(allowedBidSlots - bid.bidAttemptCount, 0),
          remainingWinSlots: winEligibility.remainingWinSlots,
          emailData: {
            cycleId: lockedCycle.id,
            bidAmount: Number(bidAmount),
            featuredDate: lockedCycle.featuredDate
          }
        };
      }
  );

  const user = await User.findByPk(userId);

  if (user?.email) {
    await sendBidPlacedEmail({
      to: user.email,
      fullName: user.fullName || user.email,
      cycleId: result.emailData.cycleId,
      bidAmount: result.emailData.bidAmount,
      featuredDate: result.emailData.featuredDate
    });
  }

  return {
    cycle: result.cycle,
    bid: result.bid,
    feedback: result.feedback,
    allowedBidSlots: result.allowedBidSlots,
    allowedWinSlots: result.allowedWinSlots,
    currentBids: result.currentBids,
    currentWins: result.currentWins,
    remainingBidSlots: result.remainingBidSlots,
    remainingWinSlots: result.remainingWinSlots
  };
};

const updateBid = async (userId, bidId, { bidAmount }) => {
  if (!bidAmount || Number(bidAmount) <= 0) {
    const error = new Error('bidAmount must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  const result = await sequelize.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
      },
      async (transaction) => {
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

        const winEligibility = await ensureMonthlyWinEligibilityForCycle(
            userId,
            bid.cycle,
            transaction
        );

        if (Number(bidAmount) <= Number(bid.bidAmount)) {
          const error = new Error('Bid amount must be greater than the current bid amount');
          error.statusCode = 400;
          throw error;
        }

        const allowedBidSlots = await getAllowedBidSlots(userId);
        const currentAttemptCount = Number(bid.bidAttemptCount || 1);

        if (currentAttemptCount >= allowedBidSlots) {
          const error = new Error('No remaining bid update slots for this cycle');
          error.statusCode = 400;
          throw error;
        }

        const previousAmount = Number(bid.bidAmount);

        bid.bidAmount = Number(bidAmount);
        bid.bidAttemptCount = currentAttemptCount + 1;
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
          feedback,
          allowedBidSlots,
          allowedWinSlots: winEligibility.allowedWinSlots,
          currentBids: bid.bidAttemptCount,
          currentWins: winEligibility.currentWins,
          remainingBidSlots: Math.max(allowedBidSlots - bid.bidAttemptCount, 0),
          remainingWinSlots: winEligibility.remainingWinSlots,
          emailData: {
            previousAmount,
            newAmount: Number(bidAmount),
            cycleId: bid.cycleId,
            featuredDate: bid.cycle?.featuredDate
          }
        };
      }
  );

  const user = await User.findByPk(userId);

  if (user?.email) {
    await sendBidUpdatedEmail({
      to: user.email,
      fullName: user.fullName || user.email,
      cycleId: result.emailData.cycleId,
      previousAmount: result.emailData.previousAmount,
      newAmount: result.emailData.newAmount,
      featuredDate: result.emailData.featuredDate
    });
  }

  return {
    cycle: result.cycle,
    bid: result.bid,
    feedback: result.feedback,
    allowedBidSlots: result.allowedBidSlots,
    allowedWinSlots: result.allowedWinSlots,
    currentBids: result.currentBids,
    currentWins: result.currentWins,
    remainingBidSlots: result.remainingBidSlots,
    remainingWinSlots: result.remainingWinSlots
  };
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

  const bid = await Bid.findOne({
    where: { userId, cycleId: activeCycle.id },
    include: [{ model: BiddingCycle, as: 'cycle' }]
  });

  const allowedBidSlots = await getAllowedBidSlots(userId);
  const allowedWinSlots = await getAllowedMonthlyWinSlots();
  const currentWins = await getWinCountForFeaturedMonth(userId, activeCycle.featuredDate);

  const currentBids = bid ? Number(bid.bidAttemptCount || 1) : 0;
  return {
    cycle: activeCycle,
    bid,
    blindStatus: bid
        ? bid.status === 'active'
            ? await getBlindStatusForBid(bid)
            : bid.status
        : 'not_placed',
    allowedBidSlots,
    allowedWinSlots,
    currentBids,
    currentWins,
    remainingBidSlots: Math.max(allowedBidSlots - currentBids, 0),
    remainingWinSlots: Math.max(allowedWinSlots - currentWins, 0)
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

  const result = await sequelize.transaction(
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
          return { cycle, winnerInfo: null };
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
          include: [{ model: User, as: 'user' }],
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        let winnerBid = null;

        for (const candidateBid of activeBids) {
          const allowedWins = await getAllowedMonthlyWinSlots();
          const currentWins = await getWinCountForFeaturedMonth(
              candidateBid.userId,
              cycle.featuredDate,
              transaction
          );

          if (currentWins < allowedWins) {
            winnerBid = candidateBid;
            break;
          }
        }

        let winnerInfo = null;

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

          const losingBids = activeBids.filter(
              (bid) => Number(bid.id) !== Number(winnerBid.id)
          );

          await markLosingBids(losingBids, transaction);

          cycle.winnerBidId = winnerBid.id;
          cycle.winnerUserId = winnerBid.userId;

          winnerInfo = {
            email: winnerBid.user?.email,
            fullName: winnerBid.user?.fullName || winnerBid.user?.email,
            bidAmount: Number(winnerBid.bidAmount),
            featuredDate: cycle.featuredDate,
            cycleId: cycle.id
          };
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

        return { cycle, winnerInfo };
      }
  );

  if (result.winnerInfo?.email) {
    await sendWinnerSelectedEmail({
      to: result.winnerInfo.email,
      fullName: result.winnerInfo.fullName,
      cycleId: result.winnerInfo.cycleId,
      bidAmount: result.winnerInfo.bidAmount,
      featuredDate: result.winnerInfo.featuredDate
    });
  }

  return result.cycle;
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
  return BiddingCycle.findOne({
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