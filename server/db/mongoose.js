// http://mongoosejs.com/docs/validation.html
// http://mongoosejs.com/docs/guide.html

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI);

module.exports = {mongoose};
