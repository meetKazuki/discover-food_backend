const express = require('express')

const cartController = require('../controllers/cartController')
const authorize = require('../../utils/authorize')

const router = express.Router()

router.post('/cart/create/:mealId', authorize('user'), cartController.createCart)
router.delete('/cart/delete/:mealId', authorize('user'), cartController.deleteMealInCart)
router.get('/cart/view/', authorize('user'), cartController.viewCartItems)
router.patch('/cart/add-meal/:mealId', authorize('user'), cartController.addMealToCart)
// router.patch('/cart/edit/:cartId', authorize('user'), cartController.editcart)
// router.delete('/cart/delete/:cartId', authorize('user'), cartController.deletecart)

module.exports = router
