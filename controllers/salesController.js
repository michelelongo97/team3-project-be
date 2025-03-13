const db = require("../data/db");

function createSale(req, res) {
  const { user_id, books, discount_id, seller_email, shipment_cost } = req.body;

  if (!user_id || !books || books.length === 0) {
    return res
      .status(400)
      .json({ message: "Almeno un User ID ed un libro sono richiesti." });
  }

  let total_price = 0;
  books.forEach((book) => {
    total_price += book.price * book.quantity;
  });

  const order_number = `ORD-${Date.now()}`;

  const sql =
    "INSERT INTO sales (user_id, discount_id, seller_email, total_price, shipment_cost, order_number, sale_date) VALUES (?, ?, ?, ?, ?, ?, NOW())";

  db.execute(
    sql,
    [
      user_id,
      discount_id || null,
      seller_email,
      total_price,
      shipment_cost || 4.99,
      order_number,
    ],
    (error, result) => {
      if (error) return res.status(500).json({ error: error.message });

      const sale_id = result.insertId;
      let completedQueries = 0;
      let totalQueries = books.length * 2;

      function isDone() {
        completedQueries++;
        if (completedQueries === totalQueries) {
          res.json({
            message: "Vendita registrata con successo!",
            order_number,
          });
        }
      }

      books.forEach((book) => {
        const saleDetailQuery =
          "INSERT INTO sale_details (sale_id, book_id, quantity, price, book_title) VALUES (?, ?, ?, ?, ?)";
        db.execute(
          saleDetailQuery,
          [sale_id, book.id, book.quantity, book.price, book.title],
          (error) => {
            if (error) return res.status(500).json({ error: error.message });
            isDone(); // Incremento il conteggio
          }
        );

        const updateBookQuery =
          "UPDATE books SET available_quantity = available_quantity - ? WHERE id = ?";
        db.execute(updateBookQuery, [book.quantity, book.id], (error) => {
          if (error) return res.status(500).json({ error: error.message });
          isDone(); // Incremento il conteggio
        });
      });
    }
  );
}

module.exports =  createSale ;
