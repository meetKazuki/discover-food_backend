const mongoose = require('mongoose')

const { Schema } = mongoose

const Order = Schema({
  dateCreated: {
    type: Date
  },
  customer: {
    type: Schema.Types.ObjectId, ref: 'User'
  },
  cart: {
    type: Schema.Types.ObjectId, ref: 'Cart'
  },
  shippingAddress: {
    type: String
  },
  pickUpTime: {
    type: Date
  },
  paymentId: {
    type: Number
  },
  referenceId: {
    type: String
  },
  amount: {
    type: Number
  }
})

module.exports = mongoose.model('Order', Order)
