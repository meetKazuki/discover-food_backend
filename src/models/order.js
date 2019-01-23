const mongoose = require('mongoose')

const { Schema } = mongoose

const Order = new Schema({
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
  },
  status: {
    type: String
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Order', Order)
