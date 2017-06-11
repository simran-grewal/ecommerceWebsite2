var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var app = express();
var ejs = require('ejs');
var ejsMate = require('ejs-mate');
var User = require('./models/user');
var cookieParser = require('cookie-parser');
var flash = require('express-flash');
var session = require('express-session');
var secret = require('./config/secret');
var MongoStore = require('connect-mongo')(session); // Passing session to MongoStore
var passport = require('passport');
var Category = require('./models/category');
var cartLength = require('./middlewares/middlewares');
mongoose.connect(secret.database, (err) => {
  if(err){
    console.log(err);
  }
  else {
    console.log('Connected To database');
  }
})
 // set our port
  var port = secret.port;
// middleWare
app.use(express.static(__dirname + '/public'));
// app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({
  resave: true, // save back to session Storage
  saveUninitialized: true,
  secret:secret.secretKey,
  store: new MongoStore({url: secret.database, autoReconnect: true})
}));
app.use(flash());
app.use(passport.initialize()); // to tell we use passport
app.use(passport.session()); // cookie To sessionId,To deserialized
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.use(cartLength);
app.use((req, res, next) => {
  // Means find app Categoies
  Category.find({}, (err, categories) => {
    if(err) return next(err);
    res.locals.categories = categories; // Save Categories in local variable
    next();
  });
});

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');

var mainRoutes = require('./routes/main');
var userRoutes = require('./routes/user');
var adminRoutes = require('./routes/admin');
var apiRoutes = require('./api/api');
app.use(mainRoutes);
app.use(userRoutes);
app.use(adminRoutes);
app.use('/api',apiRoutes)
app.listen(port, (err) => {
  if(err) throw err;
  console.log('Server is Running on '+ secret.port);
})
