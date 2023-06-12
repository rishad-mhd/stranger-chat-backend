var express = require("express");
const send = require("../controllers/messages/send");
var router = express.Router();

router.post('/', send)


module.exports = router;
