const express = require("express");
const router = express.Router();
const  createSale  = require("../controllers/salesController");

// Rotte per la wishlist
router.post("/", createSale);

module.exports = router;
