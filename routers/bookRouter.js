const express = require("express");
const router = express.Router();

//Import dei controller
const bookController = require("../controllers/bookController");
const relatedBooksController = require("../controllers/relatedBooksController");

//Index
router.get("/", bookController.index);

//Show search
router.get("/search", bookController.showSearch);

//Show
router.get("/:id", bookController.show);

//Related books
router.get("/related-books/:id", relatedBooksController.getRelatedBooks); 

//Destroy
router.delete("/:id", bookController.destroy);

module.exports = router;
