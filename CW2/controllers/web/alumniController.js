const profileService = require('../../services/profile.service');
const bidService = require('../../services/bid.service');

exports.profile = async (req, res) => {
  const profile = await profileService.getProfileByUserId(req.user.id);
  res.render('alumni/profile', { title: 'My Alumni Profile', profile });
};

exports.updateProfile = async (req, res) => {
  try {
    await profileService.updateMyProfile(req.user.id, req.body, req.file);
    req.flash('success', 'Profile saved successfully. Empty fields are allowed and can be completed later.');
  } catch (error) {
    req.flash('error', error.message || 'Profile could not be saved.');
  }
  res.redirect('/alumni/profile');
};

exports.clearProfile = async (req, res) => {
  await profileService.clearMyProfile(req.user.id);
  req.flash('success', 'Profile details and professional development records were cleared.');
  res.redirect('/alumni/profile');
};

exports.addDocument = async (req, res) => {
  try {
    await profileService.addDocument(req.user.id, req.body, req.file);
    req.flash('success', 'Professional development item added.');
  } catch (error) {
    req.flash('error', error.message || 'Professional development item could not be added.');
  }
  res.redirect('/alumni/profile#development');
};

exports.updateDocument = async (req, res) => {
  try {
    await profileService.updateDocument(req.user.id, req.params.id, req.body, req.file);
    req.flash('success', 'Professional development item updated.');
  } catch (error) {
    req.flash('error', error.message || 'Professional development item could not be updated.');
  }
  res.redirect('/alumni/profile#development');
};

exports.deleteDocument = async (req, res) => {
  try {
    await profileService.deleteDocument(req.user.id, req.params.id);
    req.flash('success', 'Professional development item deleted.');
  } catch (error) {
    req.flash('error', error.message || 'Professional development item could not be deleted.');
  }
  res.redirect('/alumni/profile#development');
};

exports.bids = async (req, res) => {
  const status = await bidService.getCurrentBidStatus(req.user.id);
  const myBids = await bidService.listMyBids(req.user.id);
  res.render('alumni/bids', { title: 'Blind Bidding', status, myBids });
};

exports.placeBid = async (req, res) => {
  try {
    const result = await bidService.placeOrIncreaseBid(req.user.id, req.body.bidAmount);
    req.flash('success', result.message);
  } catch (error) {
    req.flash('error', error.message || 'Bid could not be saved.');
  }
  res.redirect('/alumni/bids');
};

exports.cancelBid = async (req, res) => {
  try {
    const result = await bidService.cancelBid(req.user.id, req.params.id);
    req.flash('success', result.message);
  } catch (error) {
    req.flash('error', error.message || 'Bid could not be cancelled.');
  }
  res.redirect('/alumni/bids');
};
