const express = require("express");
const router = express.Router();

const {addToCart , removeFromCart, getCart , updateCartQuantity}= require("../controllers/cartController");


router.post('/', addToCart);

// Rotta per rimuovere un libro dal carrello
router.delete('/remove/:book_id/:quantity', (req, res) => {
    const { book_id, quantity } = req.params;
    removeFromCart(book_id, quantity, res); // Passa i parametri alla funzione
});

router.get('/', getCart);

router.put('/update-quantity', (req, res) => {
    updateCartQuantity(req, res); 
});

module.exports = router;
