const connection = require('../data/db');
const nodemailer = require('nodemailer');
require('dotenv').config();
const createSale = (req, res) => {
  const {
      first_name,
      last_name,
      email,
      phone,
      shipment_address,
      billing_address,
      total_price,
  } = req.body;

  // Verifica che tutti i dati richiesti siano presenti
  if (!first_name || !last_name || !email || !phone || !shipment_address || !billing_address || !total_price) {
      return res.status(400).json({
          error: "Dati mancanti",
          message: "Tutti i campi (nome, cognome, email, telefono, indirizzi, prezzo totale) sono obbligatori per completare il checkout.",
      });
  }


  // Configurazione del trasporto email
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Servizio email 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
   });

  // Inserisci l'utente nella tabella `users`
  const insertUserSql = `
      INSERT INTO users 
      (first_name, last_name, email, phone, shipment_address, billing_address, registration_date) 
      VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;
  connection.execute(
      insertUserSql,
      [first_name, last_name, email, phone, shipment_address, billing_address],
      (err, userResult) => {
          if (err) {
              console.error("Errore durante l'inserimento dell'utente:", err.message);
              return res.status(500).json({ error: "Database Error" });
          }

          const user_id = userResult.insertId; // Ottieni l'ID generato per l'utente
          processSale(user_id);
      }
  );

  function processSale(user_id) {
      const getPendingItemsSql = `
          SELECT 
              sale_details.book_id, 
              sale_details.quantity, 
              sale_details.price, 
              sale_details.book_title 
          FROM sale_details 
          WHERE sale_details.status = 'pending'
      `;

      connection.beginTransaction((err) => {
          if (err) {
              return res.status(500).json({ error: "Errore nella transazione." });
          }

          connection.execute(getPendingItemsSql, [], (err, itemsResult) => {
              if (err) {
                  return connection.rollback(() =>
                      res.status(500).json({ error: err.message })
                  );
              }

              if (itemsResult.length === 0) {
                  return connection.rollback(() =>
                      res.status(400).json({ message: "Il carrello è vuoto." })
                  );
              }

              // Calcolo del costo di spedizione
              const shipment_cost = total_price > 50 ? 0 : 4.99;
              const order_number = `ORD-${Date.now()}`;

              // Inserisci la vendita nella tabella `sales`
              const insertSaleSql = `
                  INSERT INTO sales (user_id, discount_id, total_price, shipment_cost, order_number, sale_date) 
                  VALUES (?, NULL, ?, ?, ?, NOW())
              `;
              connection.execute(
                  insertSaleSql,
                  [user_id, total_price, shipment_cost, order_number],
                  (err, result) => {
                      if (err) {
                          return connection.rollback(() =>
                              res.status(500).json({ error: err.message })
                          );
                      }

                      const sale_id = result.insertId;

                      // Aggiorna lo stato degli articoli nel carrello
                      const updateItemStatusSql = `
                          UPDATE sale_details 
                          SET sale_id = ?, status = 'confirmed' 
                          WHERE status = 'pending'
                      `;
                      connection.execute(updateItemStatusSql, [sale_id], (err) => {
                          if (err) {
                              return connection.rollback(() =>
                                  res.status(500).json({ error: err.message })
                              );
                          }

                          connection.commit((err) => {
                              if (err) {
                                  return connection.rollback(() =>
                                      res.status(500).json({ error: err.message })
                                  );
                              }


                              // INVIA EMAIL AL CLIENTE
                              const clientMailOptions = {
                                from: process.env.EMAIL_USER,
                                to: email, // Email del cliente
                                subject: 'Conferma Ordine',
                                text: `Grazie per il tuo ordine! Il numero del tuo ordine è ${order_number}.`,
                            };

                            transporter.sendMail(clientMailOptions, (err, info) => {
                                if (err) {
                                    console.error('Errore durante l\'invio dell\'email al cliente:', err.message);
                                } else {
                                    console.log('Email inviata al cliente:', info.response);
                                }
                            });

                            // INVIA EMAIL AL VENDITORE
                            const vendorMailOptions = {
                                from: process.env.EMAIL_USER,
                                to: '', // Email del venditore
                                subject: 'Nuovo Ordine Ricevuto',
                                text: `Hai ricevuto un nuovo ordine con il numero ${order_number}.`,
                            };

                            transporter.sendMail(vendorMailOptions, (err, info) => {
                                if (err) {
                                    console.error('Errore durante l\'invio dell\'email al venditore:', err.message);
                                } else {
                                    console.log('Email inviata al venditore:', info.response);
                                }
                            });

                              res.status(200).json({
                                  message: "Checkout completato con successo.",
                                  order_number,
                                  shipment_cost,
                                  total_price,
                              });
                          });
                      });
                  }
              );
          });
      });
  }
  
};

  module.exports = createSale;