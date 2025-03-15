const db = require("../data/db");

// Funzione per ottenere un user_id esistente
function getUserId(req, res) {
  const sql = "SELECT id FROM users LIMIT 1"; // Puoi anche fare un'altra query che restituisce un ID specifico
  db.execute(sql, [], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ error: "Nessun utente trovato nel database" });
    }

    // Restituisci il primo user_id trovato
    res.status(200).json({ user_id: results[0].id });
  });
}

// POST - Aggiunge un libro alla wishlist
function addToWishlist(req, res) {
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
}

// DELETE - Rimuove un libro dalla wishlist
function removeFromWishlist(req, res) {
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
}

module.exports = { getUserId, addToWishlist, removeFromWishlist };
