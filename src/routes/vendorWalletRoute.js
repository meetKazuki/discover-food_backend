const express = require('express')

const vendorWalletController = require('../controllers/vendorWalletController')
const authorize = require('../../utils/authorize')

const router = express.Router()

router.post('/vendor/wallet/create', authorize('vendor'), vendorWalletController.createVendorWallet)
// router.patch('/wallet/user-deposit', authorize('user'), vendorWalletController.walletDeposit)
// router.get('/user/wallet/', authorize('user'), vendorWalletController.getUserWallet)
// router.get('/user/transactions', authorize('user'), vendorWalletController.getUserTransactions)

module.exports = router
