const express = require('express')

const adminController = require('../controllers/adminController')
const authorize = require('../../utils/authorize')

const router = express.Router()

router.post('/admin/create-admin-email/', authorize('admin'), adminController.addAsAdminEmail)
router.post('/admin/create/', authorize('admin'), adminController.createAdmin)

module.exports = router
