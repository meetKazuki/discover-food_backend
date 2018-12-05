const express = require('express')

const vendorController = require('../controllers/vendorController')
const authorize = require('../../utils/authorize')

const router = express.Router()

router.post('/vendor/register', vendorController.register)
router.post('/vendor/login', vendorController.login)
router.get('/vendor/view-profile', authorize('User'), vendorController.viewProfile)
// router.patch('/user/edit-profile', authorize('User'), userController.editProfile)

module.exports = router
