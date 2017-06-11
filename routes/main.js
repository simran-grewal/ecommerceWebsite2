var router = require('express').Router();
var Product = require('../models/product');
var Cart  = require('../models/cart');

var stripe = require('stripe')('sk_test_FSV1TnnAu8KgXmYsOEtsVtEN');

var paginate = (req, res, next) => {
  // This is pagination
    var perPage = 9;  // Every page will have 9 product items
    var page = req.params.page;

    Product
       .find()
       .skip(perPage * page) // This is to how much we Skip i.e if we are on page 1 than we will skip 9 * 1 (9) .... Our paging is starting from zero
       .limit(perPage)
       .populate('category')
       .exec((err, products) => {
         if(err) return next(err);

         // To Count Product so that we can paging according to it
         Product.count().exec((err, count) => {
           if(err) return next(err);
           res.render('main/product-main', {
             products: products,
             pages: count/perPage
           });
         });
       });
}

// Creating bridge between  Product database and replica elastic search
Product.createMapping((err, res) => {

  if(err){
    console.log("Error Creating Mapping");
    console.log("Error");
  }  else{
    console.log("Mapping Created");
    console.log(res);
  }
});

var stream = Product.synchronize();
var count = 0;

// Count the amount of documents
stream.on('data', () => {
  count++;
})

// give the count of document after close
stream.on('close', () => {
  console.log("Indexed" + count + "Documents");
});


// Show the the user whether any error come to the server
stream.on('error', () => {
console.log(err);
})


router.get('/cart', (req, res, err) => {


    Cart
      .findOne({owner: req.user._id})
      .populate('items.item')
      .exec((err, foundCart) => {
        if(err) return next(err);

        res.render('main/cart', {
          foundCart: foundCart,
          message: req.flash('remove')

        });
      });
});


// This is for adding items in cart
router.post('/product/:product_id', (req, res, next) => {
      Cart.findOne({owner: req.user._id}, (err, cart) => {
        cart.items.push({
          item: req.body.product_id,
          price: parseFloat(req.body.priceValue),
          quantity: parseInt(req.body.quantity)
        });

        cart.total = (cart.total +  parseFloat(req.body.priceValue)).toFixed(2);

        cart.save((err) => {
          if(err) return (err);
          return res.redirect('/cart');
        });

      });
});


router.post('/remove', (req, res, next) => {
  Cart.findOne({owner: req.user._id}, (err, foundCart) => {
      foundCart.items.pull(String(req.body.item));


      foundCart.total = (foundCart.total - parseFloat(req.body.price)).toFixed(2);

      foundCart.save((err, found) => {
        if(err) return next(err);
        req.flash('remove', 'Successfully removed');
        res.redirect('/cart');
      });
  });
});



router.post('/search',(req, res, next) => {

    res.redirect('/search?q=' + req.body.q);

});

router.get('/search',(req, res, next) => {

    if(req.query.q){
      Product.search({
        query_string: {query: req.query.q}
      }, (err, results) => {

          if(err) return next(err);

          var data = results.hits.hits.map((hit) =>{
            return hit;
          });

          res.render('main/search-result', {
            query: req.query.q,
            data: data
          });

      });
    }
});

router.get('/', (req, res, next) => {
     if(req.user)  {

       paginate(req, res, next);

     } else{
       // If user is not login
    res.render('main/home');
    }
});

router.get('/about', (req, res) => {
  res.render('main/about');
});

router.get('/products/:id', (req, res, next) => {
  Product
    .find({category: req.params.id})
    .populate('category') // pupulate Because data Type is Object_id
    .exec((err, products) => {
      if(err) return next(err);

      res.render('main/category', {
        products: products
      });
    });
});

router.get('/page/:page', (req, res, next) => {
  paginate(req, res, next);
})


  router.get('/product/:id', (req, res, next) => {
    Product.findById({_id: req.params.id}, (err, product) => {
      if(err) return next(err);
      res.render('main/product', {
        product: product
      });
    });
  });



  router.get('/payment', (req, res, next) => {
    var stripeToken = req.body.stripeToken;
    var currentCharges = Math.round(req.body.stripeMony  * 100)// Total Money  in the cart // * by 100 because it need to be converted to cent

    stripe.customers.create({
      // So that be can check the people who buy stuf
      source: stripeToken,
    }).then((customer) => {
      return  stripe.charges.create({

        // This is all information charged from customers
        amount: currentCharges,
        currency: 'usd',
        customer: customer.id
      });
    });
  });

  // router.get('*', (req, res, next) => {
  //   res.redirect('/');
  // })
module.exports = router;
