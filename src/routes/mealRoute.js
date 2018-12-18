const express = require('express')

const mealController = require('../controllers/mealController')
const authorize = require('../../utils/authorize')

const router = express.Router()

router.post('/meal/create', authorize('User'), mealController.createMeal)
router.patch('/meal/edit/:mealId', authorize('User'), mealController.editMeal)
router.delete('/meal/delete/:mealId', authorize('User'), mealController.deleteMeal)
router.get('/meal/view/:mealId', authorize('User'), mealController.viewMeal)
router.put('/meal/upload/:mealId', authorize('User'), mealController.uploadMealImage)
router.post('/meal/rating/:mealId', authorize('User'), mealController.createMealRating)
router.patch('/meal/rating/edit/:mealId', authorize('User'), mealController.changeMealRating)
router.post('/meal/search/', authorize('User'), mealController.searchForMeals)

module.exports = router
