const connection = require("../data/db");
//registrazione utente
const postRegistrer = (req, res) => {
  const {
    first_name,
    last_name,
    email,
    password,
    phone,
    billing_address,
    shipment_address,
  } = req.body;
  // Controllo della lunghezza della password
  if (password.length < 10) {
    return res
      .status(400)
      .json({ message: "La password deve contenere almeno 10 caratteri" });
  }
  // Controllo se l'email è già registrata
  const sql = `SELECT * FROM users WHERE email = ?`;

  //lanciare la query
  connection.execute(sql, [email], (err, result) => {
    if (err) return res.status(500).json({ message: "Errore interno" });
    if (result.length > 0)
      return res.status(400).json({ message: "Email già registrata" });

    // Salva l'utente nel database, aggiungendo solo la data di registrazione
    const sql =
      "INSERT INTO users (first_name, last_name, email, password, phone, billing_address, shipment_address, registration_date) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_DATE())";

    connection.execute(
      sql,
      [
        first_name,
        last_name,
        email,
        password,
        phone,
        billing_address,
        shipment_address,
      ],
      (err, result) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Errore durante la registrazione" });
        }
        res.status(201).json({ message: "Utente registrato con successo" });
      }
    );
  });
};
// login utente
const postLogin = (req, res) => {
  const { email, password } = req.body;
  const sql = `SELECT * FROM users WHERE email = ?`;
  // Controlla se l'utente esiste
  connection.execute(sql, [email], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Errore interno" });
    }
    if (result.length === 0)
      return res.status(401).json({ message: "Credenziali non valide" });

    const user = result[0];

    // Confronta la password
    if (user.password !== password)
      return res.status(401).json({ message: "Credenziali non valide" });

    res.json({ message: "Login riuscito" });
  });
};

//autentificazione del profilo
const getProfile = (req, res) => {};
module.exports = { postRegistrer, postLogin, getProfile };
