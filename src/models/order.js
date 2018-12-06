const mongoose = require('mongoose')

const { Schema } = mongoose

const Order = Schema({
  orderType: {
    type: String
  },
  dateCreated: {
    type: Date
  },
  customer: {
    type: Schema.Types.ObjectId, ref: 'User'
  },
  quantity: {
    type: Number
  },
  shippingAddress: {
    type: String
  },
  subTotal: {
    type: Number
  },
  pickUpDate: {
    type: Date
  }
})

module.exports = mongoose.model('Order', Order)
