const express = require('express')
const cors = require('cors')
const port = 3000;
//Routes
const bookRouter = require("./routers/bookRouter")

const app = express()

//Cors che al momento da l' accesso a chiunque
app.use(cors())

//Middleware per l' utilizzio dei file statici
app.use(express.static('public'));

//Middleware per parsing di req.body
app.use(express.json())

// Rotte
app.use("/books" , bookRouter);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })