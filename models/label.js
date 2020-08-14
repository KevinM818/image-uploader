const mongoose = require('mongoose');

const Label = new mongoose.Schema({
  createdAt: String,
  image: String
});

module.exports = mongoose.model('Label', Label);