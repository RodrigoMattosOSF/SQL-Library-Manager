'use strict';
module.exports = (sequelize, DataTypes) => {
  const Book = sequelize.define('Book', {
    title: DataTypes.STRING,
    author: DataTypes.STRING,
    genre: DataTypes.STRING,
    year: DataTypes.INTEGER
  }, {
    validate: {
        requireTitle() {
            if (this.title === null || this.title.length < 3) {
                throw new Error('Title is required!')
            }
        },
        requireAuthor() {
            if (this.author === null || this.author.length < 3) {
                throw new Error('Author is required!')
            }
        }
    }
  });

  return Book;
};