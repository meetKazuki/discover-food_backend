const mongoose = require('mongoose')

const { Schema } = mongoose

const Cart = Schema({
  user: {
    type: Schema.Types.ObjectId, ref: 'User'
  },
  cartItems: [{
    type: Schema.Types.ObjectId, ref: 'Meal'
  }],
  totalQuantity: {
    type: Number
  },
  totalPrice: {
    type: Number
  },
  foodSize: {
    type: String
  },
  orderType: {
    type: String
  }
})

Cart.method('createCart', function (meal, user, orderType, foodSize) {
  this.cartItems.push(meal._id)
  this.totalQuantity = this.cartItems.length
  this.totalPrice = meal.unitPriceAmount
  this.vendor = meal.vendor._id
  this.orderType = orderType
  this.foodSize = foodSize
  this.user = user._id
  return this.save()
})

module.exports = mongoose.model('Cart', Cart)
