const express = require("express");
const router = express.Router();

const {addToCart , removeFromCart }= require("../controllers/cartController");


router.post('/cart', addToCart);

// Rotta per rimuovere un libro dal carrello
router.delete('/cart/remove/:book_id/:quantity', (req, res) => {
    const { book_id, quantity } = req.params;
    removeFromCart(book_id, quantity, res); // Passa i parametri alla funzione
});

module.exports = router;
