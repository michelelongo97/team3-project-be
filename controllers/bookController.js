//Dati del database
const connection = require("../data/db");

//INDEX

const index = (req, res) => {
  const sql = `
        SELECT books.*, discounts.id AS discountId, discounts.description AS discountDescription,
               discounts.value, discounts.start_date, discounts.end_date, discount_type
        FROM books
        LEFT JOIN discounts ON books.id = discounts.book_id
        ORDER BY year_edition DESC
        LIMIT 10`;

  //lanciare la query
  connection.execute(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        error: "Query Error",
        message: "Database query failed",
      });
    }
    const books = results.map((book) => {
      book.image = `${process.env.BE_URL}/book_cover/${book.image}`;
      return book;
    });

    res.json(books);
  });
};

//SHOW
const showSearch = (req, res) => {
  const searchInput = req.query.q;

  const sql = `
    SELECT books.*, genres.category, discounts.id AS discountId, discounts.description AS discountDescription,
           discounts.value, discounts.start_date, discounts.end_date, discount_type
    FROM books
    LEFT JOIN discounts ON books.id = discounts.book_id
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

    const books = results.map((book) => {
      book.image = `${process.env.BE_URL}/book_cover/${book.image}`;
      return book;
    });
    res.json(books);
  });
};

//SHOW SINGLE BOOK
const show = (req, res) => {
  const { id } = req.params;

  const bookSql = `
  SELECT books.*, genres.category, discounts.id AS discountId, discounts.description AS discountDescription,
           discounts.value, discounts.start_date, discounts.end_date, discount_type
    FROM books
    LEFT JOIN discounts ON books.id = discounts.book_id
    JOIN genres ON books.genre_id = genres.id
    WHERE 
    books.id = ? `;

  //lanciare la query
  connection.execute(bookSql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: "Query Error",
        message: "Database query failed",
      });
    }

    const book = result[0];

    if (!book) {
      return res.status(404).json({
        error: "not found",
        message: "book not found",
      });
    }

    book.image = `${process.env.BE_URL}/book_cover/${book.image}`;

    res.json(book);
  });
};

//DESTROY
const destroy = (req, res) => {};

module.exports = { index, showSearch, show, destroy };
