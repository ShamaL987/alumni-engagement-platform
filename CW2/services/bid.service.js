const { Op } = require('sequelize');
const { User, Profile, Bid, BidHistory, BiddingCycle } = require('../models');
const { sendBidResultEmail } = require('./mail.service');
const { safeArray } = require('./profile.service');

const NORMAL_CYCLE_BID_LIMIT = 3;
const SESSION_CYCLE_BID_LIMIT = 4;
const MONTHLY_WIN_LIMIT = 3;

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfTomorrow() {
  const today = startOfToday();
  return new Date(today.getTime() + 24 * 60 * 60 * 1000);
}

function getMonthRange(date = new Date()) {
  const baseDate = new Date(date);
  const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
  return { monthStart, nextMonth };
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function serializeCycle(cycle) {
  if (!cycle) return null;

  const plain = typeof cycle.get === 'function' ? cycle.get({ plain: true }) : cycle;
  const profile = plain?.winnerUser?.profile;

  if (profile) {
    for (const field of ['skills', 'degrees', 'certifications', 'licences', 'shortCourses', 'employmentHistory']) {
      profile[field] = safeArray(profile[field]);
    }
  }

  return plain;
}

function normalizeAmount(amount) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    const error = new Error('Bid amount must be greater than zero.');
    error.statusCode = 400;
    throw error;
  }

  return numericAmount;
}

function hasUniversitySessionBonus(profile) {
  return Boolean(
      profile?.attendedUniversitySession ||
      profile?.participatedInCampusSeminar ||
      Number(profile?.monthlyEventBonusCount || 0) > 0
  );
}

function getCycleBidLimit(profile) {
  return hasUniversitySessionBonus(profile) ? SESSION_CYCLE_BID_LIMIT : NORMAL_CYCLE_BID_LIMIT;
}

function getMonthlyWinLimit() {
  return MONTHLY_WIN_LIMIT;
}

async function ensureActiveCycle() {
  const now = new Date();

  let cycle = await BiddingCycle.findOne({
    where: {
      status: 'active',
      endTime: { [Op.gt]: now }
    },
    order: [['endTime', 'ASC']]
  });

  if (cycle) return cycle;

  const startTime = startOfToday();
  const endTime = startOfTomorrow();

  cycle = await BiddingCycle.create({
    startTime,
    endTime,
    featuredDate: dateOnly(endTime),
    status: 'active'
  });

  return cycle;
}

async function countMonthlyWins(userId, date = new Date()) {
  const { monthStart, nextMonth } = getMonthRange(date);

  return BiddingCycle.count({
    where: {
      winnerUserId: userId,
      status: 'processed',
      processedAt: { [Op.gte]: monthStart, [Op.lt]: nextMonth }
    }
  });
}

async function countCycleBidAttempts(userId, cycleId) {
  return BidHistory.count({
    where: {
      userId,
      cycleId,
      action: { [Op.in]: ['created', 'increased'] }
    }
  });
}

async function requireBidReadyProfile(userId) {
  const profile = await Profile.findOne({ where: { userId } });

  if (!profile || !profile.fullName || !profile.programme) {
    const error = new Error('Complete at least your full name and programme in My Profile before bidding.');
    error.statusCode = 400;
    throw error;
  }

  return profile;
}

async function getActiveBid(userId, cycleId) {
  return Bid.findOne({
    where: {
      userId,
      cycleId,
      status: 'active'
    }
  });
}

async function getBidFeedback(userId, cycleId) {
  const userBid = await getActiveBid(userId, cycleId);

  if (!userBid) {
    return {
      status: 'no_bid',
      label: 'No bid placed',
      message: 'You have not placed a bid in the current cycle.'
    };
  }

  const leadingBid = await Bid.findOne({
    where: {
      cycleId,
      status: 'active'
    },
    order: [
      ['bidAmount', 'DESC'],
      ['updatedAt', 'ASC']
    ]
  });

  if (leadingBid && leadingBid.userId === userId) {
    return {
      status: 'winning',
      label: 'Currently winning',
      message: 'Your bid is currently leading. The highest bid amount remains hidden.'
    };
  }

  return {
    status: 'losing',
    label: 'Currently losing',
    message: 'Another alumnus is currently leading. You can increase your bid before the cycle ends.'
  };
}

async function getCurrentBidStatus(userId) {
  const cycle = await ensureActiveCycle();
  const bid = await getActiveBid(userId, cycle.id);

  const currentCycleBids = await Bid.findAll({
    where: { userId, cycleId: cycle.id },
    include: [{ model: BiddingCycle, as: 'cycle' }],
    order: [['createdAt', 'DESC']]
  });

  const history = await BidHistory.findAll({
    where: { userId, cycleId: cycle.id },
    order: [['createdAt', 'DESC']]
  });

  const profile = await Profile.findOne({ where: { userId } });
  const featuredDateForLimit = new Date(cycle.featuredDate || new Date());

  const winsThisMonth = await countMonthlyWins(userId, featuredDateForLimit);
  const cycleBidAttempts = await countCycleBidAttempts(userId, cycle.id);
  const monthlyWinLimit = getMonthlyWinLimit();
  const cycleBidLimit = getCycleBidLimit(profile);
  const remainingWins = Math.max(monthlyWinLimit - winsThisMonth, 0);
  const remainingCycleBidAttempts = Math.max(cycleBidLimit - cycleBidAttempts, 0);
  const bidFeedback = await getBidFeedback(userId, cycle.id);
  const hasCompletedProfileForBidding = Boolean(profile?.fullName && profile?.programme);

  return {
    cycle,
    bid,
    currentCycleBids,
    history,
    winsThisMonth,
    monthlyWinLimit,
    remainingWins,
    cycleBidAttempts,
    cycleBidLimit,
    remainingCycleBidAttempts,
    bidAttemptsThisMonth: cycleBidAttempts,
    monthlyBidLimit: cycleBidLimit,
    remainingBidAttempts: remainingCycleBidAttempts,
    canPlaceNewBid: hasCompletedProfileForBidding && !bid && winsThisMonth < monthlyWinLimit && cycleBidAttempts < cycleBidLimit,
    canIncreaseBid: hasCompletedProfileForBidding && Boolean(bid) && winsThisMonth < monthlyWinLimit && cycleBidAttempts < cycleBidLimit,
    bidFeedback,
    attendedUniversitySession: hasUniversitySessionBonus(profile),
    hasCompletedProfileForBidding
  };
}

async function assertCanPlaceNewBid(userId) {
  const status = await getCurrentBidStatus(userId);

  if (!status.hasCompletedProfileForBidding) {
    const error = new Error('Complete at least your full name and programme in My Profile before bidding.');
    error.statusCode = 400;
    throw error;
  }

  if (status.bid) {
    const error = new Error('You already have an active bid in the current cycle. Increase that bid instead.');
    error.statusCode = 409;
    throw error;
  }

  if (status.winsThisMonth >= status.monthlyWinLimit) {
    const error = new Error(`Monthly win limit reached (${status.monthlyWinLimit}). You cannot place a new bid this month.`);
    error.statusCode = 400;
    throw error;
  }

  if (status.cycleBidAttempts >= status.cycleBidLimit) {
    const error = new Error(`Cycle bid limit reached (${status.cycleBidLimit}).`);
    error.statusCode = 400;
    throw error;
  }

  return status;
}

async function assertCanIncreaseBid(userId) {
  const status = await getCurrentBidStatus(userId);

  if (!status.hasCompletedProfileForBidding) {
    const error = new Error('Complete at least your full name and programme in My Profile before bidding.');
    error.statusCode = 400;
    throw error;
  }

  if (status.winsThisMonth >= status.monthlyWinLimit) {
    const error = new Error(`Monthly win limit reached (${status.monthlyWinLimit}). You cannot increase bids this month.`);
    error.statusCode = 400;
    throw error;
  }

  if (status.cycleBidAttempts >= status.cycleBidLimit) {
    const error = new Error(`Cycle bid limit reached (${status.cycleBidLimit}). You cannot increase this bid again in the current cycle.`);
    error.statusCode = 400;
    throw error;
  }

  return status;
}

async function createBid(userId, amount) {
  const numericAmount = normalizeAmount(amount);
  const status = await assertCanPlaceNewBid(userId);

  const bid = await Bid.create({
    userId,
    cycleId: status.cycle.id,
    bidAmount: numericAmount,
    status: 'active',
    bidAttemptCount: 1
  });

  await BidHistory.create({
    cycleId: status.cycle.id,
    bidId: bid.id,
    userId,
    action: 'created',
    newAmount: numericAmount,
    note: 'Blind bid placed'
  });

  return {
    cycle: status.cycle,
    bid,
    message: 'Bid placed. Current highest bid remains hidden.'
  };
}

async function updateBid(userId, bidId, amount) {
  const numericAmount = normalizeAmount(amount);

  const bid = await Bid.findOne({
    where: { id: bidId, userId },
    include: [{ model: BiddingCycle, as: 'cycle' }]
  });

  if (!bid || bid.status !== 'active') {
    const error = new Error('Active bid not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!bid.cycle || bid.cycle.status !== 'active' || new Date(bid.cycle.endTime) <= new Date()) {
    const error = new Error('This bidding cycle is no longer active.');
    error.statusCode = 400;
    throw error;
  }

  const previousAmount = Number(bid.bidAmount);

  if (numericAmount <= previousAmount) {
    const error = new Error('Blind bids can only be increased.');
    error.statusCode = 400;
    throw error;
  }

  await assertCanIncreaseBid(userId);

  await bid.update({
    bidAmount: numericAmount,
    bidAttemptCount: Number(bid.bidAttemptCount || 1) + 1
  });

  await BidHistory.create({
    cycleId: bid.cycleId,
    bidId: bid.id,
    userId,
    action: 'increased',
    previousAmount,
    newAmount: numericAmount,
    note: 'Bid increased by alumni'
  });

  return {
    cycle: bid.cycle,
    bid,
    message: 'Bid increased. Current highest bid remains hidden.'
  };
}

async function placeOrIncreaseBid(userId, amount) {
  const numericAmount = normalizeAmount(amount);
  const status = await getCurrentBidStatus(userId);

  if (status.bid) {
    return updateBid(userId, status.bid.id, numericAmount);
  }

  return createBid(userId, numericAmount);
}

async function cancelBid(userId, bidId) {
  const bid = await Bid.findOne({
    where: { id: bidId, userId },
    include: [{ model: BiddingCycle, as: 'cycle' }]
  });

  if (!bid || bid.status !== 'active') {
    const error = new Error('Active bid not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!bid.cycle || bid.cycle.status !== 'active' || new Date(bid.cycle.endTime) <= new Date()) {
    const error = new Error('Only bids in the active cycle can be cancelled.');
    error.statusCode = 400;
    throw error;
  }

  await bid.update({ status: 'cancelled' });

  await BidHistory.create({
    cycleId: bid.cycleId,
    bidId: bid.id,
    userId,
    action: 'cancelled',
    previousAmount: bid.bidAmount,
    note: 'Bid cancelled by alumni'
  });

  return {
    bid,
    message: 'Bid cancelled.'
  };
}

async function listMyBids(userId) {
  return Bid.findAll({
    where: { userId },
    include: [{ model: BiddingCycle, as: 'cycle' }],
    order: [['createdAt', 'DESC']]
  });
}

async function processCycle(cycle) {
  if (cycle.status === 'processed') return cycle;

  await cycle.update({ status: 'processing' });

  const bids = await Bid.findAll({
    where: { cycleId: cycle.id, status: 'active' },
    include: [
      { model: User, as: 'user', include: [{ model: Profile, as: 'profile' }] }
    ],
    order: [
      ['bidAmount', 'DESC'],
      ['updatedAt', 'ASC']
    ]
  });

  let winner = null;

  for (const bid of bids) {
    const wins = await countMonthlyWins(bid.userId, new Date(cycle.featuredDate || new Date()));

    if (wins < getMonthlyWinLimit()) {
      winner = bid;
      break;
    }
  }

  if (!winner) {
    await BidHistory.create({
      cycleId: cycle.id,
      action: 'cycle_processed_no_winner',
      note: 'No eligible bids were found'
    });

    await cycle.update({
      status: 'processed',
      processedAt: new Date()
    });

    return cycle;
  }

  await winner.update({
    status: 'won',
    selectedAt: new Date()
  });

  await Bid.update(
      { status: 'lost' },
      {
        where: {
          cycleId: cycle.id,
          id: { [Op.ne]: winner.id },
          status: 'active'
        }
      }
  );

  await cycle.update({
    status: 'processed',
    winnerBidId: winner.id,
    winnerUserId: winner.userId,
    processedAt: new Date()
  });

  await BidHistory.create({
    cycleId: cycle.id,
    bidId: winner.id,
    userId: winner.userId,
    action: 'won',
    newAmount: winner.bidAmount,
    note: 'Winner selected automatically'
  });

  for (const bid of bids) {
    await sendBidResultEmail(
        bid.user,
        bid.user.profile,
        cycle,
        bid.id === winner.id ? 'won' : 'lost',
        bid.bidAmount
    );
  }

  return cycle;
}

async function processDueCycles() {
  const cycles = await BiddingCycle.findAll({
    where: {
      status: 'active',
      endTime: { [Op.lte]: new Date() }
    }
  });

  for (const cycle of cycles) {
    await processCycle(cycle);
  }

  await ensureActiveCycle();
  return cycles.length;
}

async function processCurrentCycle() {
  const cycle = await ensureActiveCycle();
  return processCycle(cycle);
}

async function getCycleHistory() {
  return BiddingCycle.findAll({
    where: { status: 'processed' },
    include: [
      { model: User, as: 'winnerUser', include: [{ model: Profile, as: 'profile' }] },
      { model: Bid, as: 'winnerBid' }
    ],
    order: [['processedAt', 'DESC']]
  });
}

async function getCycleById(id) {
  const cycle = await BiddingCycle.findByPk(id, {
    include: [
      { model: User, as: 'winnerUser', include: [{ model: Profile, as: 'profile' }] },
      { model: Bid, as: 'winnerBid' },
      { model: Bid, as: 'bids', include: [{ model: User, as: 'user', include: [{ model: Profile, as: 'profile' }] }] }
    ]
  });

  if (!cycle) {
    const error = new Error('Bidding cycle not found.');
    error.statusCode = 404;
    throw error;
  }

  return cycle;
}

async function getAlumniOfDay() {
  await processDueCycles();

  const today = dateOnly(new Date());

  let cycle = await BiddingCycle.findOne({
    where: {
      featuredDate: today,
      status: 'processed',
      winnerUserId: { [Op.ne]: null }
    },
    include: [
      {
        model: User,
        as: 'winnerUser',
        include: [{ model: Profile, as: 'profile' }]
      },
      { model: Bid, as: 'winnerBid' }
    ],
    order: [['processedAt', 'DESC']]
  });

  if (!cycle) {
    cycle = await BiddingCycle.findOne({
      where: {
        status: 'processed',
        winnerUserId: { [Op.ne]: null }
      },
      include: [
        {
          model: User,
          as: 'winnerUser',
          include: [{ model: Profile, as: 'profile' }]
        },
        { model: Bid, as: 'winnerBid' }
      ],
      order: [['processedAt', 'DESC']]
    });
  }

  return serializeCycle(cycle);
}

module.exports = {
  ensureActiveCycle,
  getCurrentBidStatus,
  createBid,
  placeOrIncreaseBid,
  updateBid,
  cancelBid,
  listMyBids,
  processCycle,
  processDueCycles,
  processCurrentCycle,
  getCycleHistory,
  getCycleById,
  getAlumniOfDay,
  countMonthlyWins,
  countCycleBidAttempts,
  getBidFeedback,
  getCycleBidLimit,
  getMonthlyWinLimit
};
