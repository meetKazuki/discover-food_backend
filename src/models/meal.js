const mongoose = require('mongoose')

const { Schema } = mongoose

const Meal = Schema({
  name: {
    type: String
  },
  description: {
    type: String
  },
  price: {
    type: Number
  }
})

module.exports = mongoose.model('Meal', Meal)
