var express = require("express");
const getById = require("../controllers/users/getById");
const update = require("../controllers/users/update");
const getRandomUsertoChat = require("../controllers/users/getRandomUsertoChat");
var router = express.Router();

/* GET users listing. */
router.get("/user", getById);
router.get("/random", getRandomUsertoChat);
router.put("/", update);

module.exports = router;
