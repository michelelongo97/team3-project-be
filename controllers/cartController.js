//// Importa database
const connection = require('../data/db');

// Funzione che consente di aggiungere l'articolo al carrello
const addToCart = (req, res) => {
    // Estrae i parametri dalla richiesta
    const { id, quantity } = req.body;

    // Verifica che i parametri siano stati forniti
    console.log("Parametri ricevuti:", { id, quantity });

    // Recupera i dettagli del libro e le informazioni sugli sconti
    const getBookSql = `
        SELECT 
            books.title AS book_title, 
            books.price AS original_price, 
            books.available_quantity, 
            books.image, 
            discounts.description,
            discounts.start_date,
            discounts.end_date,
            discounts.discount_type,
            discounts.value
        FROM books
        LEFT JOIN discounts ON books.id = discounts.book_id
        WHERE books.id = ?
    `;
    connection.execute(getBookSql, [id], (err, bookResult) => {
        if (err) {
            console.error("Errore durante il recupero del libro:", err.message);
            res.status(500).json({
                error: "Database Error",
                message: "Errore durante il recupero del libro.",
            });
            return;
        }

        if (bookResult.length === 0) {
            res.status(404).json({
                error: "Book Not Found",
                message: "Il libro specificato non esiste.",
            });
            return;
        }

        // Estrae i dettagli del libro
        const {
            book_title,
            original_price,
            available_quantity,
            image,
            description,
            start_date,
            end_date,
            discount_type,
            value
        } = bookResult[0];

        // Verifica che la quantità richiesta sia disponibile
        if (available_quantity < quantity) {
            res.status(400).json({
                error: "Insufficient Stock",
                message: `Disponibilità insufficiente. Solo ${available_quantity} copie disponibili.`,
            });
            return;
        }

        // Inserisce i dettagli nella tabella sale_details con sale_id impostato su NULL
        const insertSql = `
            INSERT INTO sale_details (id, sale_id, book_id, quantity, price, book_title, status)
            VALUES (NULL, NULL, ?, ?, ?, ?, 'pending')

        `;
        connection.execute(insertSql, [id, quantity, original_price, book_title] , (err) => {
            if (err) {
                console.error("Errore durante l'inserimento dei dettagli:", err.message);
                res.status(500).json({
                    error: "Database Error",
                    message: "Errore durante l'inserimento dei dettagli.",
                });
                return;
            }

            // Aggiorna la quantità disponibile nella tabella books
            const updateStockSql = `UPDATE books SET available_quantity = available_quantity - ? WHERE id = ?`;
            connection.execute(updateStockSql, [quantity, id], (err) => {
                if (err) {
                    console.error("Errore durante l'aggiornamento della quantità:", err.message);
                    res.status(500).json({
                        error: "Database Error",
                        message: "Errore durante l'aggiornamento della quantità.",
                    });
                    return;
                }

                res.status(201).json({
                    message: "Articolo aggiunto al carrello con successo.",
                    data: {
                        book_title,
                        original_price,
                        image,
                        discount: {
                            description,
                            discount_type,
                            value,
                            start_date,
                            end_date
                        },
                        quantity
                    }
                });
            });
        });
    });
};



function removeFromCart(book_id, quantity, res) {
  // Controlla che i parametri siano validi
  if (!book_id || !quantity) {
    return res.status(400).json({
      message: "Book ID e quantità sono obbligatori per rimuovere l'articolo.",
    });
  }

  // Elimina l'articolo dalla tabella sale_details con stato 'pending'
  const deleteSql = `DELETE FROM sale_details WHERE book_id = ? AND status = 'pending'`;
  connection.execute(deleteSql, [book_id], (err, result) => {
    if (err) {
      console.error("Errore durante la rimozione dell'articolo:", err.message);
      return res.status(500).json({
        error: "Database Error",
        message: "Errore durante la rimozione dell'articolo dal carrello.",
      });
    }

    // Verifica se l'articolo era presente
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Articolo non trovato o già confermato.",
      });
    }

    // Ripristina la quantità disponibile nella tabella books
    const updateStockSql = `UPDATE books SET available_quantity = available_quantity + ? WHERE id = ?`;
    connection.execute(updateStockSql, [quantity, book_id], (err) => {
      if (err) {
        console.error("Errore durante il ripristino della quantità:", err.message);
        return res.status(500).json({
          error: "Database Error",
          message: "Errore durante il ripristino della quantità disponibile.",
        });
      }

      // Risposta di successo
      res.status(200).json({
        message: "Articolo rimosso dal carrello e quantità ripristinata con successo.",
      });
    });
  });
}




module.exports = {addToCart, removeFromCart}



