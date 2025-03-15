const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");

// Rotte per la wishlist
router.get("/get-user-id", wishlistController.getUserId);
router.post("/", wishlistController.addToWishlist);
router.delete("/", wishlistController.removeFromWishlist);

module.exports = router;
