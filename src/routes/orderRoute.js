const express = require('express')

const checkoutController = require('../controllers/checkoutController')
const authorize = require('../../utils/authorize')

const router = express.Router()

router.post('/order/create/:cartId/bank-account', authorize('User'), checkoutController.checkoutWithBankAccount)
router.post('/order/create/:cartId/card', authorize('User'), checkoutController.checkoutWithCard)
router.delete('/order/cancel/:orderId', authorize('User'), checkoutController.cancelOrder)

module.exports = router
