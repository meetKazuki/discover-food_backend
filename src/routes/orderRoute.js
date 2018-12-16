const express = require('express')

const checkoutController = require('../controllers/checkoutController')
const authorize = require('../../utils/authorize')

const router = express.Router()

router.post('/order/create/:cartId', authorize('User'), checkoutController.createOrder)
// router.delete('/cart/delete/:mealId', authorize('User'), cartController.deleteMealInCart)
// router.get('/cart/view/', authorize('User'), cartController.viewCartItems)
// router.patch('/cart/add-meal/:mealId', authorize('User'), cartController.addMealToCart)

module.exports = router
