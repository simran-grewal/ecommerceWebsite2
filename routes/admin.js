var router =   require('express').Router();
var Category = require('../models/category');


router.get('/add-category',  (req, res, next) => {

  if(!req.user || req.user.email != 'simrangrewal587@gmail.com'){
    res.redirect('/');
  } else{
  res.render('admin/add-category', {
    message: req.flash('success')
  });
}
});


router.post('/add-category', (req, res, next) => {
  var category = new  Category();
  category.name = req.body.name;

  category.save((err) => {
    if(err) return next(err);
    req.flash('success', 'Successfully added a category');
    return res.redirect('/add-category');
  });
});


// router.get('*', (req, res, next) => {
//   res.redirect('/');
// })

module.exports = router;
