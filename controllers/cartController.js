const db = require('../data/db');

const addToCart = async (req, res) => {
    const { user_id, book_id, quantity, price, book_title } = req.body;

    const sql = `INSERT INTO sales_details (sale_id, book_id, quantity, price, book_title, status)
    VALUES (NULL, ?, ?, ?, ?, 'pending')`; 

    const [result] = await connection.execute(sql, [book_id, quantity, price, book_title] , (err, results) => {
        if (err) {
            return res.status(500).json({
                error: "Query Error",
                message: "Database query failed",
            });
        }
        res.status(201).send({
            message: 'Articolo aggiunto al carrello con successo',
          });
    }

)
} 

module.exports = addToCart ;
   