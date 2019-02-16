const express = require('express')

const userController = require('../controllers/userControllers')
const mealController = require('../controllers/mealController')
const authorize = require('../../utils/authorize')

const router = express.Router()

router.post('/user/otp', userController.sendOtp)
router.post('/user/register', userController.register)
router.post('/user/login', userController.login)
router.post('/user/forgot-password', userController.forgotPassword)
router.patch('/user/reset-password', userController.resetPassword)
router.get('/user/view-profile', authorize('user'), userController.viewProfile)
router.patch('/user/edit-profile', authorize('user'), userController.editProfile)
router.get('/user/view-fav-vendor', authorize('user'), userController.viewFavoriteVendor)
router.patch('/user/add-fav-vendor', authorize('user'), userController.addVendorToFavorites)
router.patch('/user/remove-fav-vendor', authorize('user'), userController.removeVendorFromFavorites)
router.post('/user/meal/search/', authorize(['user', 'vendor']), mealController.searchForMeals)

module.exports = router
