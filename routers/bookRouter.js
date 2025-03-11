const express = require("express")
const router = express.Router()

//Import dei controller
const bookController = require("../controllers/bookController")

//Index
router.get("/", bookController.index);

//Show
router.get("/:id", bookController.show);

//Destroy
router.delete("/:id", bookController.destroy);

module.exports = router