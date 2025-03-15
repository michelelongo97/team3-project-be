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

      // Controlla se il libro è già presente nel carrello
      const checkCartSql = `
          SELECT quantity 
          FROM sale_details 
          WHERE book_id = ? AND status = 'pending'
      `;
      connection.execute(checkCartSql, [id], (err, cartResult) => {
          if (err) {
              console.error("Errore durante il controllo del carrello:", err.message);
              res.status(500).json({
                  error: "Database Error",
                  message: "Errore durante il controllo del carrello.",
              });
              return;
          }

          if (cartResult.length > 0) {
              // Se il libro è già nel carrello, incrementa la quantità
              const currentQuantity = cartResult[0].quantity;
              const newQuantity = currentQuantity + quantity;

              // Verifica che la nuova quantità non superi la disponibilità
              if (newQuantity > available_quantity) {
                  res.status(400).json({
                      error: "Insufficient Stock",
                      message: `Disponibilità insufficiente. Solo ${available_quantity} copie disponibili.`,
                  });
                  return;
              }

              const updateCartSql = `
                  UPDATE sale_details 
                  SET quantity = ? 
                  WHERE book_id = ? AND status = 'pending'
              `;
              connection.execute(updateCartSql, [newQuantity, id], (err) => {
                  if (err) {
                      console.error("Errore durante l'aggiornamento del carrello:", err.message);
                      res.status(500).json({
                          error: "Database Error",
                          message: "Errore durante l'aggiornamento del carrello.",
                      });
                      return;
                  }

                  // Aggiorna il magazzino
                  const updateStockSql = `
                      UPDATE books 
                      SET available_quantity = available_quantity - ? 
                      WHERE id = ?
                  `;
                  connection.execute(updateStockSql, [quantity, id], (err) => {
                      if (err) {
                          console.error("Errore durante l'aggiornamento della quantità:", err.message);
                          res.status(500).json({
                              error: "Database Error",
                              message: "Errore durante l'aggiornamento della quantità.",
                          });
                          return;
                      }

                      res.status(200).json({
                          message: "Quantità incrementata con successo nel carrello.",
                      });
                  });
              });
          } else {
              // Se il libro non è nel carrello, aggiungilo come nuovo articolo
              const insertSql = `
                  INSERT INTO sale_details (id, sale_id, book_id, quantity, price, book_title, status)
                  VALUES (NULL, NULL, ?, ?, ?, ?, 'pending')
              `;
              connection.execute(insertSql, [id, quantity, original_price, book_title], (err) => {
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
                                  end_date,
                              },
                              quantity,
                          },
                      });
                  });
              });
          }
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

// Funzione che consente di recuperare il contenuto del carrello
const getCart = (req, res) => {
  const getCartItemsSql = `
      SELECT 
          sale_details.book_id, 
          sale_details.quantity, 
          sale_details.price, 
          books.title AS book_title, 
          books.image , 
          discounts.description,
          discounts.discount_type,
          discounts.value
      FROM sale_details
      LEFT JOIN books ON sale_details.book_id = books.id
      LEFT JOIN discounts ON books.id = discounts.book_id
      WHERE sale_details.status = 'pending'
  `;
  connection.execute(getCartItemsSql, [], (err, result) => {
      if (err) {
          console.error("Errore durante il recupero del carrello:", err.message);
          return res.status(500).json({
              error: "Database Error",
              message: "Errore durante il recupero del carrello.",
          });
          
      }
      
      const updatedCart = result.map((book) => {
        book.image = `${process.env.BE_URL}/book_cover/${book.image}`;
        return book;
    }); 

      res.status(200).json({
          message: "Carrello recuperato con successo.",
          cart: updatedCart,
      });
  });
};

function updateCartQuantity(req, res) {
  const { book_id, quantity } = req.body;

  // Controlla che i parametri siano validi
  if (!book_id || quantity === undefined || quantity < 1) {
      return res.status(400).json({
          message: "ID del libro e una quantità valida (>= 1) sono obbligatori.",
      });
  }

  // Recupera la quantità attuale dal carrello
  const getCurrentQuantitySql = `
      SELECT quantity 
      FROM sale_details 
      WHERE book_id = ? AND status = 'pending'
  `;

  connection.execute(getCurrentQuantitySql, [book_id], (err, result) => {
      if (err) {
          console.error("Errore durante il recupero della quantità:", err.message);
          return res.status(500).json({
              error: "Database Error",
              message: "Errore durante il recupero della quantità attuale.",
          });
      }

      if (result.length === 0) {
          return res.status(404).json({
              message: "Articolo non trovato nel carrello.",
          });
      }

      const currentQuantity = result[0].quantity;

      // Calcola la differenza tra quantità attuale e nuova quantità
      const quantityDifference = quantity - currentQuantity;

      // Aggiorna la quantità nella tabella sale_details
      const updateQuantitySql = `
          UPDATE sale_details 
          SET quantity = ? 
          WHERE book_id = ? AND status = 'pending'
      `;

      connection.execute(updateQuantitySql, [quantity, book_id], (err) => {
          if (err) {
              console.error("Errore durante l'aggiornamento della quantità:", err.message);
              return res.status(500).json({
                  error: "Database Error",
                  message: "Errore durante l'aggiornamento della quantità.",
              });
          }

          // Aggiorna il magazzino in base alla differenza
          const updateStockSql = `
              UPDATE books 
              SET available_quantity = available_quantity - ? 
              WHERE id = ?
          `;

          connection.execute(updateStockSql, [quantityDifference, book_id], (err) => {
              if (err) {
                  console.error("Errore durante l'aggiornamento del magazzino:", err.message);
                  return res.status(500).json({
                      error: "Database Error",
                      message: "Errore durante l'aggiornamento del magazzino.",
                  });
              }

              // Risposta di successo
              res.status(200).json({
                  message: "Quantità aggiornata con successo.",
              });
          });
      });
  });
}







module.exports = {addToCart, removeFromCart, getCart , updateCartQuantity}



