const mongoose = require('mongoose')

const { Schema } = mongoose

const Meal = new Schema({
  vendor: {
    type: Schema.Types.ObjectId, ref: 'Vendor'
  },
  name: {
    type: String
  },
  description: {
    type: String
  },
  unitPriceType: {
    type: String
  },
  unitPriceAmount: {
    type: Number
  },
  mealImages: [{
    type: String
  }],
  quantity: {
    type: Number
  },
  timeToPrepare: {
    type: Number
  }
})

module.exports = mongoose.model('Meal', Meal)
