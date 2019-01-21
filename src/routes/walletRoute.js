const express = require('express')

const walletController = require('../controllers/walletController')
const authorize = require('../../utils/authorize')

const router = express.Router()

router.post('/wallet/user-fund', authorize('user'), walletController.fundWallet)
router.patch('/wallet/user-deposit', authorize('user'), walletController.walletDeposit)
router.get('/user/wallet/', authorize('user'), walletController.getUserWallet)
router.get('/user/transactions', authorize('user'), walletController.getUserTransactions)

module.exports = router
