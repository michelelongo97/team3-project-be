const express = require("express");
const cors = require("cors");
//Routes
const bookRouter = require("./routers/bookRouter");
const wishlistRouter = require("./routers/wishlistRouter");
const cartRouter = require("./routers/cartRouter");
const userRouter = require("./routers/userRouter");
//Middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();
const { PORT, FE_URL } = process.env;
//Middleware per parsing di req.body
app.use(express.json());
//Cors che al momento da l' accesso a chiunque
app.use(
  cors({
    origin: FE_URL,
  })
);

//Middleware per l' utilizzio dei file statici
app.use(express.static("public"));

// Rotte
app.use("/books", bookRouter);
app.use("/wishlist", wishlistRouter);
app.use("/books", cartRouter);
app.use("/users", userRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
