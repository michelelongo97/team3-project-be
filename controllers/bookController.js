//Dati del database
const connection = require("../data/db");

//INDEX

const index = (req, res) => {
  const sql = `
        SELECT books.*, discounts.id AS discountId, discounts.description,
               discounts.value, discounts.start_date, discounts.end_date
        FROM books
        LEFT JOIN discounts ON books.id = discounts.book_id
        ORDER BY year_edition DESC
        LIMIT 5`;

  //lanciare la query
  connection.execute(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        error: "Query Error",
        message: "Database query failed",
      });
    }
    const books = results.map((book) => {
      book.image = `${process.env.BE_URL}/books/${book.image}`;
      return book;
    });

    res.json(books);
  });
};

//SHOW
const showSearch = (req, res) => {
  const searchInput = req.query.q;

  const sql = `
    SELECT books.*, genres.category
    FROM books
    JOIN genres ON books.genre_id = genres.id
    WHERE books.title LIKE ?
    OR books.author LIKE ?
    OR genres.category LIKE ?
    `;
  //Faccio una ricerca parziale con %

  const searchSql = `%${searchInput}%`;

  connection.query(sql, [searchSql, searchSql, searchSql], (err, results) => {
    if (err) {
      return res.status(500).json({
        error: "Query Error",
        message: `Database query failed: ${sql}`,
      });
    }
    res.json(results);
  });
};
//SHOW
const show = (req, res) => {};

//DESTROY
const destroy = (req, res) => {};

module.exports = { index, showSearch, show, destroy };
