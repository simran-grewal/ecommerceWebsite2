var router = require('express').Router();
var User = require('../models/user');
var passport = require('passport');
var async = require('async');
var passportConf = require('../config/passport');
var Cart = require('../models/cart');
router.get('/login', (req, res) => {
    if(req.user) return res.redirect('/');
    res.render('account/login', {message: req.flash('loginMessage')});
});
                                        // local-login is middleWare
router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true //  so that get request can recieve failure flash
}));

router.get('/profile',(req, res, next) => {
  User.findOne({_id: req.user._id}, (err, user) => {
    if(err) return next(err);
    res.render('account/profile', {user: user});
  });


});

router.get('/signup', (req, res, next) => {
  res.render('account/signup', {
    errors: req.flash('errors')
  });
});

// Create User
router.post('/signup', (req, res, next) => {



  async.waterfall([

    (callback) => {

      var user = new User();
      user.profile.name = req.body.name;
      user.password = req.body.password;
      user.email = req.body.email;
      user.profile.picture = user.gravatar();

      User.findOne({email: req.body.email}, (err, existingUser) => {
        if(existingUser){
          req.flash('errors','Account with that email already exist');
          return res.redirect('/signup');
        }else{
          user.save((err, user) => {
            if(err) return next(err);

            callback(null, user);
          });
        }
      });
    },

    (user) => {

        var cart = new Cart();
        cart.owner = user._id;
        cart.save((err) => {
          if(err) return next(err);

          // adding session to the server and cookie to the browser
          req.logIn(user, function(err) {
            if(err) return next(err);
            res.redirect('/profile');
          });
        });
    }
  ]);
});

router.get('/logout', (req, res, next) => {
  req.logout();
  res.redirect('/');
});

router.get('/edit-profile', (req, res, next) => {
  res.render('account/edit-profile.ejs', {message: req.flash('success')});
});

router.post('/edit-profile', ( req, res, next) => {
  User.findOne({_id: req.user._id}, (err, user) => {
    if(err)  return next(err);

    if(req.body.name) {
      user.profile.name = req.body.name;
    }

    if(req.body.address){
      user.address = req.body.address;
    }

    user.save((err) => {
      if(err) return next(err);
      req.flash('success', 'Successfully  Edited your profile');
      return res.redirect('/edit-profile');
    });
  });
});

// router.get('*', (req, res, next) => {
//   res.redirect('/');
// })

module.exports = router;
