const express   = require('express');
const db    = require('./models');
const BookModel = require('./models/book');
const Book      = BookModel(db.sequelize, db.Sequelize);

class Routes {
    constructor() {
        this.router = express.Router();
        this.init();
    }

    init() {
        const that  = this;

        this.router.get('/', function(req, res) {
            res.redirect('/books');
        });

        this.router.get('/books', function(req, res) {
            return Book.findAll().then( result => {
                const books = result.map(book => {
                    return {
                        id     : book.id,
                        title  : book.title,
                        author : book.author,
                        genre  : book.genre,
                        year   : book.year
                    };
                });

                res.render('index', {
                    head  : {
                        title : 'Books'
                    },
                    books : books
                });
            }).catch(err => {

            });            
        });

        this.router.get('/books/new', function(req, res, next) {
            const book = {
                id     : 0,
                title  : '',
                author : '',
                genre  : '',
                year   : ''
            };

            res.render('book', {
                head  : {
                    title : 'New Book'
                },
                action : '/books/new',
                book   : book
            });
        });

        this.router.post('/books/new', function(req, res, next) {
            const { title, author, genre, year } = req.body;

            const book = Book.build({
                title  : title,
                author : author,
                genre  : genre,
                year   : year
            })
            
            book.validate().then( (result, never) => {
                //ADD NEW BOOK
                return db.sequelize.transaction(function (t) {
                    
                    return Book.create({
                        title  : result.title,
                        author : result.author,
                        genre  : result.genre,
                        year   : result.year
                    }, {transaction: t});
                    
                }).then(function (result) {
                    // Transaction has been committed
                    res.redirect('/books');
                }).catch(function (err) {
                    // Transaction has been rolled back
                    //RETURN FIELD ERRORS
                    res.render('book', {
                        head  : {
                            title : book.title
                        },
                        errors : [{
                            message : 'A problem ocurred while trying to add this book, try again later!'
                        }],
                        book : book
                    });
                });
            }).catch( err => {
                //RETURN FIELD ERRORS
                res.render('book', {
                    head  : {
                        title : 'New Book'
                    },
                    action : '/books/new',
                    errors : err.errors,
                    book   : book
                });
            });
        });

        this.router.get('/books/:id', function(req, res, next) {
            const { id } = req.params;
            const bookID = parseInt(id);

            if (!isNaN(bookID)) {
                return Book.findById(bookID).then( result => {
                    if (!result)
                        that.handleError({ 
                            title   : 'Page Not Found',
                            header  : 'Server Error',
                            message : 'Sorry! There was an unexpected error on the server.',
                            status  : 404,
                            view    : 'error'
                        }, req, res, next)

                    const book = {
                        id     : result.id,
                        title  : result.title,
                        author : result.author,
                        genre  : result.genre,
                        year   : result.year
                    };

                    res.render('book', {
                        head  : {
                            title : book.title
                        },
                        action : '/books/' + bookID,
                        book : book
                    });
                }).catch(err => {
                    console.log(err);
                });
            }
        });

        this.router.post('/books/:id', function(req, res, next) {
            const { id } = req.params;
            const { title, author, genre, year } = req.body;
            const bookID = parseInt(id);

            if (!isNaN(bookID)) {
                const book = Book.build({
                    id     : bookID,
                    title  : title,
                    author : author,
                    genre  : genre,
                    year   : year
                })
                
                book.validate().then( result => {
                    //UPDATE BOOK
                    return db.sequelize.transaction(function (t) {
                        return Book.update({
                            title  : result.title,
                            author : result.author,
                            genre  : result.genre,
                            year   : result.year
                        }, {
                            transaction: t,
                            where : {
                                id : bookID,
                            }
                        });
                      
                    }).then(function (result) {
                        // Transaction has been committed
                        res.redirect('/books');
                    }).catch(function (err) {
                        // Transaction has been rolled back
                        //RETURN FIELD ERRORS
                        res.render('book', {
                            head  : {
                                title : book.title
                            },
                            errors : [{
                                message : 'A problem ocurred while trying to update this book, try again later!'
                            }],
                            book : book
                        });
                    });                    
                }).catch( err => {
                    //RETURN FIELD ERRORS
                    res.render('book', {
                        head  : {
                            title : book.title
                        },
                        errors : err.errors,
                        book : book
                    });
                });
            }
        });

        this.router.post('/books/:id/delete', function(req, res, next) {
            const { id } = req.params;
            const bookID = parseInt(id);

            if (!isNaN(bookID)) {
                
                Book.findById(bookID).then( result => {
                    //UPDATE BOOK
                    return db.sequelize.transaction(function (t) {
                        return Book.destroy({
                            transaction: t,
                            where : {
                                id : result.id,
                            }
                        });
                      
                    }).then(function (result) {
                        // Transaction has been committed
                        res.redirect('/books');
                    }).catch(function (err) {
                        // Transaction has been rolled back
                        //RETURN FIELD ERRORS
                        res.render('book', {
                            head  : {
                                title : book.title
                            },
                            errors : [{
                                message : 'A problem ocurred while trying to delete this book, try again later!'
                            }],
                            book : book
                        });
                    });                    
                }).catch( err => {
                    //RETURN FIELD ERRORS
                    res.render('book', {
                        head  : {
                            title : book.title
                        },
                        errors : err.errors,
                        book : book
                    });
                });
            }
        });
    }

    get() {
        return this.router;
    }

    handleError(err, req, res, next) {
        res.locals.error = err;
        res.status(err.status);
        res.render(err.view, {
            head  : {
                title : err.title
            },
            error : err
        });
    }

    notFound(req, res, next) {
        const err   = new Error('Not Found');
        err.status  = 404;
        err.title   = 'Page not Found';
        err.header  = 'Page not Found';
        err.message = "Sorry! We couldn't find the page you were looking for."
        err.view    = 'notfound';
        next(err);
    }
}

module.exports = new Routes();