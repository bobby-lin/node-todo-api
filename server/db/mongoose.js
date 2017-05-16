// http://mongoosejs.com/docs/validation.html
// http://mongoosejs.com/docs/guide.html

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/TodoApp');

module.exports = {mongoose};