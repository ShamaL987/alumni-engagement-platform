const bidService = require('../../services/bid.service');

const current = async (req, res, next) => {
  try {
    const status = await bidService.getCurrentBidStatus(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Current bid cycle status retrieved successfully.',
      data: status
    });
  } catch (error) {
    next(error);
  }
};

const place = async (req, res, next) => {
  try {
    const result = await bidService.createBid(req.user.id, req.body.bidAmount);
    res.status(201).json({
      success: true,
      message: 'Bid placed successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const status = async (req, res, next) => {
  try {
    const result = await bidService.getCurrentBidStatus(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Current bid status retrieved successfully.',
      data: {
        feedback: result.bid ? 'placed' : 'not_placed',
        bid: result.bid,
        cycle: result.cycle,
        winsThisMonth: result.winsThisMonth,
        monthlyLimit: result.monthlyLimit,
        canBid: result.canBid
      }
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await bidService.updateBid(req.user.id, req.params.id, req.body.bidAmount);
    res.status(200).json({
      success: true,
      message: 'Bid updated successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const mine = async (req, res, next) => {
  try {
    const bids = await bidService.listMyBids(req.user.id);
    res.status(200).json({
      success: true,
      message: 'My bids retrieved successfully.',
      data: bids
    });
  } catch (error) {
    next(error);
  }
};

const cancel = async (req, res, next) => {
  try {
    const result = await bidService.cancelBid(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Bid cancelled successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const processCurrent = async (req, res, next) => {
  try {
    const cycle = await bidService.processCurrentCycle();
    res.status(200).json({
      success: true,
      message: 'Current cycle processed successfully.',
      data: cycle
    });
  } catch (error) {
    next(error);
  }
};

const history = async (req, res, next) => {
  try {
    const cycles = await bidService.getCycleHistory();
    res.status(200).json({
      success: true,
      message: 'Cycle history retrieved successfully.',
      data: cycles
    });
  } catch (error) {
    next(error);
  }
};

const cycle = async (req, res, next) => {
  try {
    const result = await bidService.getCycleById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Cycle details retrieved successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  current,
  place,
  status,
  update,
  mine,
  cancel,
  processCurrent,
  history,
  cycle
};
