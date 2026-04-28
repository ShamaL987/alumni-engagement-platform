const bidService = require('../../services/bid.service');

exports.current = async (req, res) => {
  const status = await bidService.getCurrentBidStatus(req.user.id);
  res.json({ success: true, data: status });
};

exports.place = async (req, res) => {
  const result = await bidService.createBid(req.user.id, req.body.bidAmount);
  res.status(201).json({ success: true, data: result });
};

exports.status = async (req, res) => {
  const status = await bidService.getCurrentBidStatus(req.user.id);
  let feedback = 'not_placed';
  if (status.bid) feedback = 'placed';
  res.json({
    success: true,
    data: {
      feedback,
      bid: status.bid,
      cycle: status.cycle,
      winsThisMonth: status.winsThisMonth,
      monthlyLimit: status.monthlyLimit,
      canBid: status.canBid
    }
  });
};

exports.update = async (req, res) => {
  const result = await bidService.updateBid(req.user.id, req.params.id, req.body.bidAmount);
  res.json({ success: true, data: result });
};

exports.mine = async (req, res) => {
  const bids = await bidService.listMyBids(req.user.id);
  res.json({ success: true, data: bids });
};

exports.cancel = async (req, res) => {
  const result = await bidService.cancelBid(req.user.id, req.params.id);
  res.json({ success: true, data: result });
};

exports.processCurrent = async (req, res) => {
  const cycle = await bidService.processCurrentCycle();
  res.json({ success: true, data: cycle });
};

exports.history = async (req, res) => {
  const cycles = await bidService.getCycleHistory();
  res.json({ success: true, data: cycles });
};

exports.cycle = async (req, res) => {
  const cycle = await bidService.getCycleById(req.params.id);
  res.json({ success: true, data: cycle });
};
