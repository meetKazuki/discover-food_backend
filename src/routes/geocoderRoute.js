const express = require('express')

const geocoderController = require('../controllers/geocoderController')

const router = express.Router()

router.post('/address-coordinate', geocoderController.addressCoordinates)

module.exports = router
