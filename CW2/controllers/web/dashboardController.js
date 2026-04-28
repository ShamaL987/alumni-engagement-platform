exports.index = (req, res) => {
  if (req.user.role === 'alumni') return res.redirect('/alumni/profile');
  if (req.user.role === 'client') return res.redirect('/client/dashboard');
  if (req.user.role === 'admin') return res.redirect('/admin/api-keys');
  return res.redirect('/login');
};
