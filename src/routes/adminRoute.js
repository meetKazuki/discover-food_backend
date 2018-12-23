const express = require('express')

const adminController = require('../controllers/adminController')
const authorize = require('../../utils/authorize')

const router = express.Router()

router.post('/admin/create-admin-email/', authorize('super-admin'), adminController.addAsAdminEmail)
router.post('/admin/create/', adminController.createAdmin)
router.delete('/admin/remove/:adminId', authorize('super-admin'), adminController.removeAdmin)
router.get('/admin/get-users', authorize(['admin', 'super-admin']), adminController.getAllUsers)
router.get('/admin/get-user/:userId', authorize(['admin', 'super-admin']), adminController.getSingleUser)
router.patch('/admin/activate-vendor/:userId', authorize(['admin', 'super-admin']), adminController.activeUserVendorRole)
router.get('/admin/pending-vendors-request', authorize(['admin', 'super-admin']), adminController.getAllPendingVendorRequest)
router.post('/admin/login', adminController.login)

module.exports = router
