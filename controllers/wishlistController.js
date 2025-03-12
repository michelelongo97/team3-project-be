const db = require("../data/db");

// POST - Aggiunge un libro alla wishlist
exports.addToWishlist = (req, res) => {
  const { user_id, book_id } = req.body;

  if (!user_id || !book_id) {
    return res
      .status(400)
      .json({ message: "User ID e Book ID sono richiesti." });
  }

  const sql =
    "INSERT INTO book_user (user_id, book_id, added_date) VALUES (?, ?, NOW())";
  db.execute(sql, [user_id, book_id], (error, results) => {
    if (error) {
      res.status(500).json({ error: error.message });
    } else {
      res
        .status(201)
        .json({ message: "Il libro è stato aggiunto alla wishlist" });
    }
  });
};

// DELETE - Rimuove un libro dalla wishlist
exports.removeFromWishlist = (req, res) => {
  const { user_id, book_id } = req.body;

  if (!user_id || !book_id) {
    return res
      .status(400)
      .json({ message: "User ID e Book ID sono richiesti." });
  }

  const sql = "DELETE FROM book_user WHERE user_id = ? AND book_id = ?";
  db.execute(sql, [user_id, book_id], (error, results) => {
    if (error) {
      res.status(500).json({ error: error.message });
    } else if (results.affectedRows === 0) {
      res
        .status(404)
        .json({ message: "Impossibile trovare il libro nella wishlist" });
    } else {
      res
        .status(200)
        .json({ message: "Il libro è stato rimosso dalla wishlist" });
    }
  });
};
