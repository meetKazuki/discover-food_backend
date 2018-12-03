const express = require('express')
const userRoute = require('./userRoute')
const vendorRoute = require('./vendorRoute')

const router = express.Router()
// All your parent route link should be in this file
// Create your route file in the routes folder and link your file here
/**
 * e.g const userRoute = require('./userRoute');
 *     router.use("/user", userRoute)
 */

router.use('/api/v1/', userRoute)
router.use('/api/v1/', vendorRoute)
module.exports = router
