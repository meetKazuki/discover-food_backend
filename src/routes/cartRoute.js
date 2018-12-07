const express = require('express')

const cartController = require('../controllers/cartController')
const authorize = require('../../utils/authorize')

const router = express.Router()

router.post('/cart/create/:mealId', authorize('User'), cartController.createCart)
router.delete('/cart/delete/:mealId', authorize('User'), cartController.deleteMealInCart)
router.get('/cart/view/', authorize('User'), cartController.viewCartItems)
router.patch('/cart/add-meal/:mealId', authorize('User'), cartController.addMealToCart)
// router.patch('/cart/edit/:cartId', authorize('User'), cartController.editcart)
// router.delete('/cart/delete/:cartId', authorize('User'), cartController.deletecart)

module.exports = router
