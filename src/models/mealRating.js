const mongoose = require('mongoose')

const { Schema } = mongoose
const MealRating = new Schema({
  user: {
    type: Schema.Types.ObjectId, ref: 'User'
  },
  meal: {
    type: Schema.Types.ObjectId, ref: 'Meal'
  },
  rating: {
    type: Number
  }
})

module.exports = mongoose.model('MealRating', MealRating)
