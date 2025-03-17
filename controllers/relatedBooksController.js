const connection = require("../data/db");

const getRelatedBooks = (req, res) => {
  const { id } = req.params; // Prende l'ID del libro dalla rotta

  const sql = `
    SELECT DISTINCT b.*
    FROM books b
    JOIN books main_book ON main_book.id = ?
    WHERE 
    (b.genre_id = main_book.genre_id OR b.author = main_book.author)
    AND b.id != ?
    LIMIT 6;
  `;

  connection.execute(sql, [id, id], (err, results) => {
    if (err) {
      console.error("Errore nella query:", err);
      return res.status(500).json({
        error: "Query Error",
        message: "Database query failed",
      });
    }

    console.log("Libri correlati trovati:", results);

    const relatedBooks = results.map((book) => {
      book.image = `${process.env.BE_URL}/book_cover/${book.image}`;
      return book;
    });

    res.json(relatedBooks);
  });
};

module.exports = { getRelatedBooks };
