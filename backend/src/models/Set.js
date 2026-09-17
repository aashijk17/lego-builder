const mongoose = require('mongoose');

const setSchema = new mongoose.Schema({
  setId: String,
  name: String,
  year: Number,
  piecesCount: Number,
  imageUrl: String,
  rebrickableUrl: String,
  theme: Number,
  brickList: [{
    brickId: String,
    brickName: String,
    quantity: Number,
    colorId: Number,
    colorName: String
  }],
  fetchedAt: Date
});

module.exports = mongoose.model('Set', setSchema);
