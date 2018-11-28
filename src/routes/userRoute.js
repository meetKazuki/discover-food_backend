const express = require('express')

const userController = require('../controllers/userControllers')

const router = express.Router()

router.post('/register', userController.register)
router.post('/login', userController.login)

module.exports = router
