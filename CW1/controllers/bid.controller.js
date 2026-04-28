const bidService = require('../services/bid.service');

const placeBid = async (req, res, next) => {
  try {
    const result = await bidService.placeBid(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Bid placed successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const updateBid = async (req, res, next) => {
  try {
    const result = await bidService.updateBid(req.user.id, req.params.bidId, req.body);
    res.status(200).json({
      success: true,
      message: 'Bid updated successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const cancelBid = async (req, res, next) => {
  try {
    await bidService.cancelBid(req.user.id, req.params.bidId);
    res.status(200).json({
      success: true,
      message: 'Bid cancelled successfully.'
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentCycle = async (req, res, next) => {
  try {
    const result = await bidService.getCurrentCycle();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const processCurrentCycle = async (req, res, next) => {
  try {
    const result = await bidService.processCurrentCycle();
    res.status(200).json({
      success: true,
      message: 'Current cycle processed successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const listOwnBids = async (req, res, next) => {
  try {
    const result = await bidService.listOwnBids(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getMyCurrentBidStatus = async (req, res, next) => {
  try {
    const result = await bidService.getMyCurrentBidStatus(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const listCycleHistory = async (req, res, next) => {
  try {
    const result = await bidService.getCycleHistory({ limit: req.query.limit || 25 });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getCycleHistoryById = async (req, res, next) => {
  try {
    const result = await bidService.getCycleHistoryById(req.params.cycleId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  placeBid,
  updateBid,
  cancelBid,
  getCurrentCycle,
  processCurrentCycle,
  listOwnBids,
  getMyCurrentBidStatus,
  listCycleHistory,
  getCycleHistoryById
};
