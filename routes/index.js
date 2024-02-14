var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/about', function(req, res, next) {
  res.render('about');
});

router.get('/contact', function(req, res, next) {
  res.render('contact');
});


router.get('/users/login',(req,res)=>{
  res.render('users',{login:true})
})
router.get('/users/signup',(req,res)=>{
  res.render('users',{login:false})
})

module.exports = router;
