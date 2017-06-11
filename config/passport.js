var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;// it is for local login
var User = require('../models/user');
// Serilazed and deserialized To store on connect mongo
passport.serializeUser(function(user, done) {
  done(null, user._id); // callBack
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});
//middleware
passport.use('local-login', new LocalStrategy({
  usernameField : 'email',
  passwordField: 'password',
  passReqToCallback: true
}, function(req, email, password, done){
    User.findOne({email: email}, function(err, user){
      if(err) return done(err);

      if(!user){
        return done(null, false, req.flash('loginMessage', 'No user has been found'));
      }

      if(!user.comparePassword(password)){
        return done(null, false, req.flash('loginMessage', 'Opps! Wrong Password'));
      }
      return done(null,user);
    });
}));

//Custom function to check validation

exports.isAuthenticated = function(req, response, next){

  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/login');
}
