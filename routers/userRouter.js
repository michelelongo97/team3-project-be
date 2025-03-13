const express = require("express");
const router = express.Router();
//Import dei controller
const userController = require("../controllers/userController");

// Funzione per autenticare il token
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];

  // Controlla se il token è presente
  if (!token) return res.status(403).json({ message: "Token mancante" });

  // Verifica la validità del token senza JWT
  if (token !== "valid_token") {
    return res.status(403).json({ message: "Token non valido" });
  }

  // Se il token è valido, prosegui con la richiesta
  next();
};

//Post registrazione
router.post("/register", userController.postRegistrer);

//Post registrazione
router.post("/login", userController.postLogin);

//Post registrazione
router.get("/profile", authenticateToken, userController.getProfile);

module.exports = router;
