const express = require('express')

const mealController = require('../controllers/mealController')
const authorize = require('../../utils/authorize')

const router = express.Router()

router.post('/meal/create', authorize('User'), mealController.createMeal)
router.patch('/meal/edit/:mealId', authorize('User'), mealController.editMeal)
router.delete('/meal/delete/:mealId', authorize('User'), mealController.deleteMeal)

module.exports = router
