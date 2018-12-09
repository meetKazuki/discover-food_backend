const mongoose = require('mongoose')

const { Schema } = mongoose

// var schema = new Schema({
//   user: { type: Schema.Types.ObjectId, ref: 'User' },
//   cart: { type: Object, required: true },
//   address: { type: String, required: true },
//   name: { type: String, required: true },
//   paymentId: { type: String, required: true }
// })
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
    type: String
  }
})

module.exports = mongoose.model('Order', Order)
