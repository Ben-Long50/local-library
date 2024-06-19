import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';
import Book from '../models/book.js';
import BookInstance from '../models/bookinstance.js';

const bookinstanceController = {
  // Display list of all BookInstances.
  bookinstance_list: asyncHandler(async (req, res, next) => {
    const allBookInstances = await BookInstance.find().populate('book').exec();

    res.render('bookinstance_list', {
      title: 'Book Instance List',
      bookinstance_list: allBookInstances,
    });
  }),

  // Display detail page for a specific BookInstance.
  bookinstance_detail: asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id)
      .populate('book')
      .exec();

    if (bookInstance === null) {
      // No results.
      const err = new Error('Book copy not found');
      err.status = 404;
      return next(err);
    }

    res.render('bookinstance_detail', {
      title: 'Book:',
      bookinstance: bookInstance,
    });
  }),

  // Display BookInstance create form on GET.
  bookinstance_create_get: asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, 'title').sort({ title: 1 }).exec();

    res.render('bookinstance_form', {
      title: 'Create BookInstance',
      book_list: allBooks,
      selected_book: undefined,
      errors: undefined,
      bookinstance: undefined,
    });
  }),

  // Handle BookInstance create on POST.
  bookinstance_create_post: [
    // Validate and sanitize fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified')
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body('status').escape(),
    body('due_back', 'Invalid date')
      .optional({ values: 'falsy' })
      .isISO8601()
      .toDate(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a BookInstance object with escaped and trimmed data.
      const bookInstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back,
      });

      if (!errors.isEmpty()) {
        // There are errors.
        // Render form again with sanitized values and error messages.
        const allBooks = await Book.find({}, 'title').sort({ title: 1 }).exec();

        res.render('bookinstance_form', {
          title: 'Create BookInstance',
          book_list: allBooks,
          selected_book: bookInstance.book._id,
          errors: errors.array(),
          bookinstance: bookInstance,
        });
      } else {
        // Data from form is valid
        await bookInstance.save();
        res.redirect(bookInstance.url);
      }
    }),
  ],

  // Display BookInstance delete form on GET.
  bookinstance_delete_get: asyncHandler(async (req, res, next) => {
    // Get details of bookinstance
    const bookinstance = await BookInstance.findById(req.params.id).exec();

    if (bookinstance === null) {
      // No results.
      res.redirect('/catalog/bookinstances');
    }

    res.render('bookinstance_delete', {
      title: 'Delete Book Instance',
      bookinstance,
    });
  }),

  // Handle BookInstance delete on POST.
  bookinstance_delete_post: asyncHandler(async (req, res, next) => {
    await BookInstance.findByIdAndDelete(req.body.bookinstanceid);
    res.redirect('/catalog/bookinstances');
  }),

  // Display BookInstance update form on GET.
  bookinstance_update_get: asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, 'title').sort({ title: 1 }).exec();
    const bookinstance = await BookInstance.findById(req.params.id)
      .populate('book')
      .exec();

    if (bookinstance === null) {
      // No results.
      const err = new Error('Book not found');
      err.status = 404;
      return next(err);
    }

    res.render('bookinstance_form', {
      title: 'Update Book Instance',
      book_list: allBooks,
      bookinstance,
      selected_book: bookinstance.book._id,
      errors: undefined,
    });
  }),

  // Handle bookinstance update on POST.
  bookinstance_update_post: [
    // Validate and sanitize fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified')
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body('status').escape(),
    body('due_back', 'Invalid date')
      .optional({ values: 'falsy' })
      .isISO8601()
      .toDate(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a BookInstance object with escaped and trimmed data.
      const bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back,
        _id: req.params.id,
      });

      if (!errors.isEmpty()) {
        // There are errors.
        // Render form again with sanitized values and error messages.
        const allBooks = await Book.find({}, 'title').sort({ title: 1 }).exec();

        res.render('bookinstance_form', {
          title: 'Update Book Instance',
          book_list: allBooks,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance,
        });
      } else {
        // Data from form is valid
        const updatedBookInstance = await BookInstance.findByIdAndUpdate(
          req.params.id,
          bookinstance,
          {},
        );
        res.redirect(updatedBookInstance.url);
      }
    }),
  ],
};

export default bookinstanceController;
