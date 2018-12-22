const express = require('express')

const adminController = require('../controllers/adminController')
const authorize = require('../../utils/authorize')

const router = express.Router()

router.post('/admin/create-admin-email/', authorize('super-admin'), adminController.addAsAdminEmail)
router.post('/admin/create/', authorize('super-admin'), adminController.createAdmin)
router.get('/admin/get-users', authorize(['admin', 'super-admin']), adminController.getAllUsers)
router.get('/admin/get-user/:userId', authorize(['admin', 'super-admin']), adminController.getAUser)
router.post('/admin/login', adminController.login)

module.exports = router
