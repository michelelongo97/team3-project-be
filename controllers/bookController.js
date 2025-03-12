//Dati del database
const connection = require("../data/db")

//INDEX
const index = (req, res) =>{

    const sql = `SELECT title , year_of_release , editor, original_title, year_edition, image, author
                FROM books
                WHERE year_edition > 2020`
    
    //lanciare la query
    connection.execute(sql, (err, results) => {
        if(err){
            return res.status(500).json({
                error:"Query Error",
                message:"Database query failed"
            });
        }
        const books = results.map((book) => {
            book.image =`${process.env.BE_URL}/books/${book.image}`
            return book;
         })
        
         res.json(books);
        
    }) 
   
}

//SHOW
const show = (req, res) =>{}

//DESTROY
const destroy = (req, res) =>{}

module.exports={index, show, destroy}