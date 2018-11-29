const express = require('express')

const userController = require('../controllers/userControllers')

const router = express.Router()

router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/forgot-password', userController.forgotPassword)
router.patch('/reset-password', userController.resetPassword)

module.exports = router
