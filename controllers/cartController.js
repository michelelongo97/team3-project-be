//// Importa database
const connection = require('../data/db'); 

// Funzione che consente di aggiungere l articolo al carrello
const addToCart = (req, res) => {
  // Estrae i parametri dalla richiesta
    const { id, quantity, price } = req.body;

    // Verifica che i parametri siano stati forniti
    console.log("Parametri ricevuti:", { id, quantity, price });

    // Recupera i dettagli del libro dalla tabella books
    const getBookSql = `SELECT title AS book_title, price, available_quantity FROM books WHERE id = ?`;
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
        const { book_title, price: dbPrice, available_quantity } = bookResult[0];

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
            VALUES (NULL, NULL, ?, ?, ?, ?, 'pending')`;
        connection.execute(insertSql, [id, quantity, price || dbPrice, book_title], (err) => {
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
                });
            });
        });
    });
};

module.exports =  addToCart ;

