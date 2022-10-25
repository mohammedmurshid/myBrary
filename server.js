if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const bodyParser = require("body-parser")
const methodOverride = require("method-override")


app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("layout", "layouts/layout");
app.use(expressLayouts);
app.use(methodOverride('_method'))
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: false}))

// setting up routers
const indexRouter = require("./routes/index");
const authorRouter = require("./routes/authors")
const bookRouter = require("./routes/books")

app.use("/", indexRouter);
app.use("/authors", authorRouter);
app.use("/books", bookRouter);

// setting up database
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
});

const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongoose'))


app.listen(process.env.PORT || 5000);
