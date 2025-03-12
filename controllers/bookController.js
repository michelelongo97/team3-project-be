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
const show = (req, res) =>{
    const {id} = req.params
    const bookSql = `
    SELECT books.*,genres.*,discounts.value AS discount_percentage,
    CASE 
        WHEN discounts.value IS NOT NULL 
        THEN ROUND(books.price - (books.price * discounts.value / 100), 2)
    END AS discounted_price
    FROM books
    LEFT JOIN 
    discounts ON books.id = discounts.book_id
    JOIN 
    genres ON genres.id = books.genre_id
    WHERE 
    books.id = 150; `; 

    //lanciare la query
    connection.execute(bookSql, [id], (err, result) => {
        if(err){
            return res.status(500).json({
                error:"Query Error",
                message:"Database query failed"
            })
        }

        
        const book = result[0]

        if(!book){
            return res.status(404).json({
                error: "not found",
                message:"movie not found"
            })
        }

       book.image =`${process.env.BE_URL}/movies/${book.image}`

       res.json(book)           
})
   
}

//DESTROY
const destroy = (req, res) =>{}

module.exports={index, show, destroy}