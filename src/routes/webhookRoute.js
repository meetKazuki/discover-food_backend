const express = require('express')

const webhookController = require('../controllers/webhookController')
const authorize = require('../../utils/authorize')

const router = express.Router()

router.post('/fuudnet-webhook', webhookController.recieveWebhook)

module.exports = router
