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


const processSelection = async (req, res, next) => {
  try {
    const targetDate = req.body.targetDate || new Date().toISOString().slice(0, 10);
    const winner = await bidService.processWinnerSelectionForDate(targetDate);
    res.status(200).json({
      success: true,
      message: 'Winner selection processed.',
      data: winner
    });
  } catch (error) {
    next(error);
  }
};

const listOwnBids = async (req, res, next) => {
  try {
    const result = await bidService.listOwnBids(req.user.id);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getMyBidStatusForDate = async (req, res, next) => {
  try {
    const result = await bidService.getMyBidStatusForDate(req.user.id, req.query.targetDate);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  placeBid,
  updateBid,
  cancelBid,
  listOwnBids,
  getMyBidStatusForDate,
  processSelection
};
