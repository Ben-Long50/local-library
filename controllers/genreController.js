import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';
import Genre from '../models/genre.js';
import Book from '../models/book.js';

const genreController = {
  // Display list of all Genre.
  genre_list: asyncHandler(async (req, res, next) => {
    const allGenres = await Genre.find().sort({ name: 1 }).exec();
    res.render('genre_list', {
      title: 'Genre List',
      genre_list: allGenres,
    });
  }),

  // Display detail page for a specific Genre.
  genre_detail: asyncHandler(async (req, res, next) => {
    const [genre, booksInGenre] = await Promise.all([
      Genre.findById(req.params.id).exec(),
      Book.find({ genre: req.params.id }, 'title summary').exec(),
    ]);
    if (genre === null) {
      // No results.
      const err = new Error('Genre not found');
      err.status = 404;
      return next(err);
    }

    res.render('genre_detail', {
      title: 'Genre Detail',
      genre,
      genre_books: booksInGenre,
    });
  }),

  // Display Genre create form on GET.
  genre_create_get(req, res, next) {
    res.render('genre_form', {
      title: 'Create Genre',
      genre: undefined,
      errors: undefined,
    });
  },

  // Handle Genre create on POST.
  genre_create_post: [
    // Validate and sanitize the name field.
    body('name', 'Genre name must contain at least 3 characters')
      .trim()
      .isLength({ min: 3 })
      .escape(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a genre object with escaped and trimmed data.
      const genre = new Genre({ name: req.body.name });

      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render('genre_form', {
          title: 'Create Genre',
          genre,
          errors: errors.array(),
        });
      } else {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        const genreExists = await Genre.findOne({ name: req.body.name })
          .collation({ locale: 'en', strength: 2 })
          .exec();
        if (genreExists) {
          // Genre exists, redirect to its detail page.
          res.redirect(genreExists.url);
        } else {
          await genre.save();
          // New genre saved. Redirect to genre detail page.
          res.redirect(genre.url);
        }
      }
    }),
  ],

  // Display Genre delete form on GET.
  genre_delete_get: asyncHandler(async (req, res, next) => {
    // Get details of genre and all their books (in parallel)
    const [genre, allBooksInGenre] = await Promise.all([
      Genre.findById(req.params.id).exec(),
      Book.find({ genre: req.params.id }, 'title summary').exec(),
    ]);

    if (genre === null) {
      // No results.
      res.redirect('/catalog/genres');
    }

    res.render('genre_delete', {
      title: 'Delete Genre',
      genre,
      genre_books: allBooksInGenre,
    });
  }),

  // Handle Genre delete on POST.
  genre_delete_post: asyncHandler(async (req, res, next) => {
    // Get details of genre and all their books (in parallel)
    const [genre, allBooksInGenre] = await Promise.all([
      Genre.findById(req.params.id).exec(),
      Book.find({ genre: req.params.id }, 'title summary').exec(),
    ]);

    if (allBooksInGenre.length > 0) {
      // Genre has books. Render in same way as for GET route.
      res.render('genre_delete', {
        title: 'Delete Genre',
        genre,
        genre_books: allBooksInGenre,
      });
    } else {
      // Genre has no books. Delete object and redirect to the list of genres.
      await Genre.findByIdAndDelete(req.body.genreid);
      res.redirect('/catalog/genres');
    }
  }),

  // Display Genre update form on GET.
  genre_update_get: asyncHandler(async (req, res, next) => {
    // Get genre for form.
    const genre = await Genre.findById(req.params.id).exec();

    if (genre === null) {
      // No results.
      const err = new Error('Book not found');
      err.status = 404;
      return next(err);
    }

    res.render('genre_form', {
      title: 'Update Genre',
      genre,
      errors: undefined,
    });
  }),

  // Handle Genre update on POST.
  genre_update_post: [
    // Validate and sanitize the name field.
    body('name', 'Genre name must contain at least 3 characters')
      .trim()
      .isLength({ min: 3 })
      .escape(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a genre object with escaped and trimmed data.
      const genre = new Genre({ name: req.body.name, _id: req.params.id });

      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render('genre_form', {
          title: 'Create Genre',
          genre,
          errors: errors.array(),
        });
      } else {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        const genreExists = await Genre.findOne({ name: req.body.name })
          .collation({ locale: 'en', strength: 2 })
          .exec();
        if (genreExists) {
          // Genre exists, redirect to its detail page.
          res.redirect(genreExists.url);
        } else {
          const updatedGenre = await Genre.findByIdAndUpdate(
            req.params.id,
            genre,
            {},
          );
          // New genre saved. Redirect to genre detail page.
          res.redirect(updatedGenre.url);
        }
      }
    }),
  ],
};

export default genreController;
