const express = require('express')

const userController = require('../controllers/userControllers')
const authorize = require('../../utils/authorize')

const router = express.Router()

router.post('/user/register', userController.register)
router.post('/user/login', userController.login)
router.post('/user/forgot-password', userController.forgotPassword)
router.patch('/user/reset-password', userController.resetPassword)
router.get('/user/view-profile', authorize('User'), userController.viewProfile)
router.patch('/user/edit-profile', authorize('User'), userController.editProfile)

module.exports = router
