const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Book = require("../models/book");
const Author = require("../models/author");
const uploadPath = path.join("public", Book.coverImageBasePath);
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
const upload = multer({
  dest: uploadPath,
  fileFilter: (req, file, callback) => {
    callback(null, imageMimeTypes.includes(file.mimetype));
  },
});

// All Books route
router.get("/", async (req, res) => {
  let query = Book.find()
  if (req.query.title != null && req.query.title != '') {
    query = query.regex('title', new RegExp(req.query.title, 'i'))
  }
  if (req.query.publisheBefore != null && req.query.publisheBefore != '') {
    query = query.lte('publishDate', req.query.publishedBefore)
  }
  if (req.query.publisheAfter != null && req.query.publisheAfter != '') {
    query = query.gte('publishDate', req.query.publishedAfter)
  }
  try {
    const books = await query.exec()
    res.render("books/index", {
      books: books,
      searchOptions: req.query
    })
  } catch {
    res.redirect("/")
  }
});

// New Book route
router.get("/new", async (req, res) => {
  renderNewPage(res, new Book());
});

// Create Book route
router.post("/", upload.single("cover"), async (req, res) => {
  const fileName = req.file != null ? req.file.filename : null;
  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    publishDate: new Date(req.body.publishDate),
    pageCount: req.body.pageCount,
    coverImageName: fileName,
    description: req.body.description,
  });
  try {
    const newBook = await book.save();
    res.redirect(`books/${newBook.id}`)
    // res.redirect("books");
  } catch {
    if (book.coverImageName != null) {
      removeBookCover(book.coverImageName)
    }
    renderNewPage(res, book, true);
  }
});

// Show Book Route
router.get("/:id", async (req, res) => {
  try { 
    const book = await Book.findById(req.params.id).populate('author').exec()
    res.render("books/show", { book: book })
  } catch {
    res.redirect("/")
  }
})

// Edit Book route
router.get("/:id/edit", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
    renderEditPage(res, book);    
  } catch {
    res.redirect('/')
  }
});

// Update Book route
router.put("/:id", upload.single("cover"), async (req, res) => {
  let book
  try {
    book = await Book.findById(req.params.id)
    book.title = req.body.title
    book.author = req.body.author
    book.publishDate = new Date(req.body.publishDate)
    book.pageCount = req.body.pageCount
    book.description = req.body.description
    if (req.body.cover !== null && req.body.cover !== '') {
      saveCover(book, req.body.cover)
    }
    await book.save();
    // res.redirect(`books/${newBook.id}`)
    res.redirect(`/books/${book.id}`);
  } catch(err) {
    console.log(err);
    if (book != null) {
      renderEditPage(res, book, true);
    } else {
      res.redirect('/')
    }
  }
});

// Delete Book Page
router.delete("/:id", async (req, res) => {
  let book
  try {
    book = await Book.findById(req.params.id)
    await book.remove()
    res.redirect("/books")
  } catch {
    if (book != null) {
      res.render("books/show", {
        book: book,
        errorMessage: "Could not remove book"
      })
    } else {
      res.redirect("/")
    }
  }
})


// Defining the function to encapsulate
function removeBookCover(fileName) {
  fs.unlink(path.join(uploadPath, fileName), err => {
    if (err) console.error(err)
  })
}

// Defining the function to encapsulate
async function renderNewPage(res, book, hasError = false) {
  renderFormPage(res, book, 'new', hasError = false)
}

// Defining the function to encapsulate
async function renderEditPage(res, book, hasError = false) {
  renderFormPage(res, book, 'edit', hasError = false)
}

// Defining the function to encapsulate
async function renderFormPage(res, book, form, hasError = false) {
  try {
    const authors = await Author.find({});
    const params = {
      authors: authors,
      book: book,
    };
    if (hasError) {
      if (form == 'edit') {
        params.errorMessage = "Error editing Book";
      } else {
        params.errorMessage = "Error creating Book";
      }
    }    
    res.render(`books/${form}`, params);
  } catch {
    res.redirect("/books");
  }
}

module.exports = router;
