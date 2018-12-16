const mongoose = require('mongoose')

const { Schema } = mongoose
const MealImage = new Schema({
  url: {
    type: String
  }
})

module.exports = mongoose.model('MealImage', MealImage)
