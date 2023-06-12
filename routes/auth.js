var express = require('express');
const login = require('../controllers/auth/login');
const regenerateToken = require('../controllers/auth/regenerateToken');
var router = express.Router();

/* GET users listing. */
router.post('/login',login);
router.post('/token/regenerate',regenerateToken);

module.exports = router;
