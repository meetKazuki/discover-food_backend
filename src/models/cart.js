const mongoose = require('mongoose')

const { Schema } = mongoose

const Cart = Schema({
  user: {
    type: Schema.Types.ObjectId, ref: 'User'
  },
  cartItems: [{
    type: Schema.Types.ObjectId, ref: 'Meal'
  }]
})

module.exports = mongoose.model('Cart', Cart)
