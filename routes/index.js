var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/users',(req,res)=>{
  res.render('users')
})

module.exports = router;
