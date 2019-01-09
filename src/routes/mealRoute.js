const express = require('express')

const mealController = require('../controllers/mealController')
const authorize = require('../../utils/authorize')

const router = express.Router()

router.post('/meal/create', authorize('vendor'), mealController.createMeal)
router.patch('/meal/edit/:mealId', authorize('vendor'), mealController.editMeal)
router.delete('/meal/delete/:mealId', authorize('vendor'), mealController.deleteMeal)
router.get('/meal/view/:mealId', authorize('vendor'), mealController.viewMeal)
router.put('/meal/upload/:mealId', authorize('vendor'), mealController.uploadMealImage)
router.post('/meal/rating/:mealId', authorize('vendor'), mealController.createMealRating)
router.patch('/meal/rating/edit/:mealId', authorize('vendor'), mealController.changeMealRating)
router.get('/meal/all', mealController.viewAllMeals)
router.get('/meal/vendor-meals', authorize('vendor'), mealController.viewAllVendorMeals)

module.exports = router
