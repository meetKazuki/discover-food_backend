const express = require('express')
const userRoute = require('./userRoute')
const vendorRoute = require('./vendorRoute')
const mealRoute = require('./mealRoute')
const cartRoute = require('./cartRoute')
const geocoderRoute = require('./geocoderRoute')
const orderRoute = require('./orderRoute')
const adminRoute = require('./adminRoute')

const router = express.Router()
// All your parent route link should be in this file
// Create your route file in the routes folder and link your file here
/**
 * e.g const userRoute = require('./userRoute');
 *     router.use("/user", userRoute)
 */

router.use('/api/v1/', userRoute)
router.use('/api/v1/', vendorRoute)
router.use('/api/v1/', mealRoute)
router.use('/api/v1/', cartRoute)
router.use('/api/v1/', geocoderRoute)
router.use('/api/v1/', orderRoute)
router.use('/api/v1/', adminRoute)
module.exports = router
