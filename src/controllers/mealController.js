// const mongoose = require('mongoose')
/**
 * A vendor should be able to create own meal
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const createMeal = (req, res) => {
  const { currentUser } = req

  const fieldInputs = [
    'name',
    'description',
    'orderSize',
    'pricePerOrderSize',
    'quantity',
    'timeToPrepare',
    'orderType'
  ]
  const inputVals = fieldInputs
    .filter(fieldInput => req.body[fieldInput])
    .map(value => ({
      [value]: req.body[value]
    }))

  if (!inputVals.length) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  const combineInputsInObjReducer = (inputsObject, currentValue) => {
    const [key] = Object.keys(currentValue)
    inputsObject[key] = currentValue[key]
    return inputsObject
  }
  const modifiedInputValues = inputVals.reduce(combineInputsInObjReducer, {})
  modifiedInputValues.location = currentUser.location

  modifiedInputValues.vendor = currentUser._id
  return req.Models.Meal.create(modifiedInputValues)
    .then((createdMeal) => {
      if (!createdMeal) {
        const serverError = new Error()
        serverError.message = 'Something went wrong, meal could not be created'
        serverError.statusCode = 500
        return Promise.reject(serverError)
      }

      return res.status(201).send({
        statusCode: 201,
        message: 'Meal successfully created',
        data: [createdMeal]
      })
    })
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({
        message: err.message ? err.message : 'Something something went wrong',
        statusCode: err.statusCode ? err.statusCode : 500
      }))
}

/**
 * A vendor should be able to edit own meal
 * @param {Object} req
 * @param {Object} res
 *
 * @return {Object} response
 */
const editMeal = (req, res) => {
  const { currentUser } = req
  const { mealId } = req.params
  const fieldInputs = [
    'name',
    'description',
    'orderSize',
    'pricePerOrderSize',
    'quantity',
    'timeToPrepare',
    'orderType'
  ]
  const inputVals = fieldInputs.filter(fieldInput => req.body[fieldInput])
    .map(value => ({
      [value]: req.body[value]
    }))

  if (!mealId && !inputVals.length) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  const combineInputsInObjReducer = (inputsObject, currentValue) => {
    const [key] = Object.keys(currentValue)
    inputsObject[key] = currentValue[key]
    return inputsObject
  }

  const modifiedInputValues = inputVals.reduce(combineInputsInObjReducer, {})

  return req.Models.Meal.findOneAndUpdate({
    _id: mealId,
    vendor: currentUser._id
  }, modifiedInputValues, { new: true })
    .then((updatedMeal) => {
      if (!updatedMeal) {
        const mealDoesNotExistError = new Error()
        mealDoesNotExistError.message = 'Meal does not exist'
        mealDoesNotExistError.statusCode = 400
        res.status(400).send(mealDoesNotExistError)
      }
      return res.status(200).send({
        statusCode: 200,
        message: 'Successfully updated Meal',
        data: updatedMeal.toObject()
      })
    })
    .catch(() => {
      const serverError = new Error()
      serverError.message = 'Something went wrong, meal could not be updated'
      serverError.statusCode = 500
      res.status(500).send(serverError)
    })
}

/**
 * A vendor should be able to delete own meal
 * @param {Object} req
 * @param {Object} res
 *
 * @return {Object} response
 */
const deleteMeal = (req, res) => {
  const { currentUser } = req
  const { mealId } = req.params

  if (!mealId) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  return req.Models.Meal.findOneAndDelete({
    _id: mealId,
    vendor: currentUser._id
  })
    .then((deletedMeal) => {
      if (!deletedMeal) {
        const mealDoesNotExistError = new Error()
        mealDoesNotExistError.message = 'Meal does not exist'
        mealDoesNotExistError.statusCode = 400
        res.status(400).send(mealDoesNotExistError)
      }
      return res.status(200).send({
        statusCode: 200,
        message: 'Successfully deleted Meal',
        data: deletedMeal.toObject()
      })
    })
    .catch(() => {
      const serverError = new Error()
      serverError.message = 'Something went wrong, meal could not be deleted'
      serverError.statusCode = 500
      res.status(500).send(serverError)
    })
}

/**
 * A user should be able to view a meal
 * @param {Object} req
 * @param {Object} res
 *
 * @return {Object} response
 */
const viewMeal = (req, res) => {
  const { mealId } = req.params

  if (!mealId) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  req.Models.Meal.findOne({
    _id: mealId
  })
    .populate('vendor')
    .exec()
    .then((meal) => {
      if (!meal) {
        const mealDoesNotExistError = new Error()
        mealDoesNotExistError.message = 'Meal does not exist'
        mealDoesNotExistError.statusCode = 400
        return res.status(400).send(mealDoesNotExistError)
      }
      return res.status(200).send({
        statusCode: 200,
        message: 'Successfully got a meal',
        data: meal
      })
    })
    .catch(() => {
      const serverError = new Error()
      serverError.message = 'Something went wrong, meal could not be fetched'
      return res.status(500).send(serverError)
    })
}

/**
 * A vendor should be able to images on a meal
 * @param {Object} req
 * @param {Object} res
 *
 * @return {Object} response
 */
const uploadMealImage = (req, res) => {
  const { currentUser } = req
  const { mealId } = req.params
  const fieldInputs = [
    'mealImages',
  ]
  const inputVals = fieldInputs.filter(fieldInput => req.body[fieldInput])
    .map(value => ({
      [value]: req.body[value]
    }))

  let images
  if (!mealId) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing meal id'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  if (!inputVals.length) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  const combineInputsInObjReducer = (inputsObject, currentValue) => {
    const [key] = Object.keys(currentValue)
    inputsObject[key] = currentValue[key]
    return inputsObject
  }

  const modifiedInputValues = inputVals.reduce(combineInputsInObjReducer, {})


  req.Models.Meal.findOne({
    _id: mealId,
    vendor: currentUser._id
  })
    .then((updatedMeal) => {
      if (!updatedMeal) {
        const mealDoesNotExistError = new Error()
        mealDoesNotExistError.message = 'Meal does not exist'
        mealDoesNotExistError.statusCode = 400
        return res.status(400).send(mealDoesNotExistError)
      }

      images = updatedMeal.mealImages.concat(modifiedInputValues.mealImages)

      if (images.length > 10) {
        const mealImagesNotGreaterThanTen = new Error()
        mealImagesNotGreaterThanTen.message = 'The images of a meal cannot be greater than 10'
        mealImagesNotGreaterThanTen.statusCode = 400
        return res.status(400).send(mealImagesNotGreaterThanTen)
      }

      return req.Models.Meal.findOneAndUpdate({
        _id: mealId,
        vendor: currentUser._id
      }, {
        mealImages: images
      }, { new: true })
    })
    .then((updatedMealImage) => {
      res.status(200).send({
        statusCode: 200,
        message: 'Successfully updated Meal',
        data: updatedMealImage
      })
    })
    .catch(() => {
      const serverError = new Error()
      serverError.message = 'Something went wrong, meal could not be updated'
      serverError.statusCode = 500
      return res.status(500).send(serverError)
    })
}

/**
 * A user should be able to create a rating for a meal
 * @param {Object} req
 * @param {Object} res
 *
 * @return {Object} response
 */
const createMealRating = (req, res) => {
  const { mealId } = req.params
  const { currentUser } = req

  const fieldInputs = [
    'mealRating',
  ]
  const inputVals = fieldInputs.filter(fieldInput => req.body[fieldInput])
    .map(value => ({
      [value]: req.body[value]
    }))


  if (!mealId) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  if (!inputVals.length) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  const combineInputsInObjReducer = (inputsObject, currentValue) => {
    const [key] = Object.keys(currentValue)
    inputsObject[key] = currentValue[key]
    return inputsObject
  }

  const modifiedInputValues = inputVals.reduce(combineInputsInObjReducer, {})

  req.Models.MealRating.findOne({
    meal: mealId,
    user: currentUser._id
  })
    .then((mealRating) => {
      if (mealRating) {
        const mealRatingExistError = new Error()
        mealRatingExistError.message = 'Meal rating already exists, cannot create'
        mealRatingExistError.statusCode = 400
        return res.status(400).send(mealRatingExistError)
      }
      return req.Models.MealRating.create({
        user: currentUser._id,
        meal: mealId,
        rating: modifiedInputValues.mealRating
      })
    })
    .then(createdMealRating => req.Models.MealRating.findById({
      _id: createdMealRating._id
    })
      .populate('user')
      .populate('meal')
      .exec())
    .then(mealRating => res.status(200).send({
      statusCode: 200,
      message: 'Successfully rated meal',
      data: mealRating
    }))
    .catch(() => {
      const serverError = new Error()
      serverError.message = 'Something went wrong, meal could not be fetched'
      serverError.statusCode = 500
      res.status(500).send(serverError)
    })
}

/**
 * A user should be able to change meal rating
 * @param {Object} req
 * @param {Object} res
 *
 * @return {Object} response
 */
const changeMealRating = (req, res) => {
  const { mealId } = req.params
  const { currentUser } = req

  const fieldInputs = [
    'mealRating',
  ]
  const inputVals = fieldInputs.filter(fieldInput => req.body[fieldInput])
    .map(value => ({
      [value]: req.body[value]
    }))


  if (!mealId) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  if (!inputVals.length) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  const combineInputsInObjReducer = (inputsObject, currentValue) => {
    const [key] = Object.keys(currentValue)
    inputsObject[key] = currentValue[key]
    return inputsObject
  }

  const modifiedInputValues = inputVals.reduce(combineInputsInObjReducer, {})

  req.Models.MealRating.findOne({
    meal: mealId,
    user: currentUser._id
  })
    .then((mealRating) => {
      if (!mealRating) {
        const mealRatingDoesNotExistError = new Error()
        mealRatingDoesNotExistError.message = 'Meal rating does not exist yet'
        mealRatingDoesNotExistError.statusCode = 400
        return res.status(400).send(mealRatingDoesNotExistError)
      }
      return req.Models.MealRating.findOneAndUpdate({
        user: currentUser._id,
        meal: mealId
      }, {
        rating: modifiedInputValues.mealRating
      }, { new: true })
        .populate('user')
        .populate('meal')
        .exec()
    })
    .then(mealRating => res.status(200).send({
      statusCode: 400,
      message: 'Meal rating successfully changed',
      data: mealRating
    }))
    .catch(() => {
      const serverError = new Error()
      serverError.message = 'Something went wrong, meal could not be fetched'
      serverError.statusCode = 500
      res.status(500).send(serverError)
    })
}

/**
 * A user should be search for a meal
 * search by text
 * search by coordinates
 * combine each result
 * @param {Object} req
 * @param {Object} res
 *
 * @return {Object} response
 */
const searchForMeals = (req, res) => {
  const fieldInputs = [
    'searchText',
    'location'
  ]
  const inputVals = fieldInputs.filter(fieldInput => req.body[fieldInput])
    .map(value => ({
      [value]: req.body[value]
    }))

  if (!inputVals.length) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  const combineInputsInObjReducer = (inputsObject, currentValue) => {
    const [key] = Object.keys(currentValue)
    inputsObject[key] = currentValue[key]
    return inputsObject
  }

  const modifiedInputValues = inputVals.reduce(combineInputsInObjReducer, {})

  if (modifiedInputValues.location) {
    const { latitude } = modifiedInputValues.location
    const { longitude } = modifiedInputValues.location
    modifiedInputValues.location = {
      coordinates: [latitude, longitude]
    }
  }

  req.Models.Meal
    .find({
      $text: {
        $search: modifiedInputValues.searchText ?
          modifiedInputValues.searchText : ''
      },
      'location.coordinates': {
        $geoWithin: {
          $center: modifiedInputValues.location ?
            [modifiedInputValues.location.coordinates, 1000] : [[0, 0], 1000]
        }
      }
    })
    .populate({ path: 'vendor', populate: { path: 'user' } })
    .exec()
    .then((searchResult) => {
      res.status(200).send(searchResult)
    })
}

/**
 * A user should be able to view a meal
 * @param {Object} req
 * @param {Object} res
 *
 * @return {Object} response
 */
const viewAllMeals = (req, res) => {
  let {
    perPage,
    page
  } = req.query
  perPage = perPage ? Number(perPage) : 10
  page = page ? Number(page) : 1
  req.Models.Meal.find()
    .skip(perPage * (page - 1))
    .limit(perPage)
    .populate('vendor')
    .exec()
    .then((meals) => {
      if (!meals) {
        const mealDoesNotExistError = new Error()
        mealDoesNotExistError.message = 'Meal does not exist'
        mealDoesNotExistError.statusCode = 400
        return res.status(400).send(mealDoesNotExistError)
      }
      return res.status(200).send({
        statusCode: 200,
        message: 'Successfully got a meal',
        data: meals
      })
    })
    .catch(() => {
      const serverError = new Error()
      serverError.message = 'Something went wrong, meals could not be fetched'
      return res.status(500).send(serverError)
    })
}

/**
 * A user should be able to view a meal
 * @param {Object} req
 * @param {Object} res
 *
 * @return {Object} response
 */
const viewAllVendorMeals = (req, res) => {
  const { currentUser } = req
  let {
    perPage,
    page
  } = req.query
  perPage = perPage ? Number(perPage) : 10
  page = page ? Number(page) : 1
  req.Models.Meal.find({
    vendor: currentUser._id
  })
    .skip(perPage * (page - 1))
    .limit(perPage)
    .populate('vendor')
    .exec()
    .then((meals) => {
      if (!meals) {
        const mealDoesNotExistError = new Error()
        mealDoesNotExistError.message = 'Meal does not exist'
        mealDoesNotExistError.statusCode = 400
        return res.status(400).send(mealDoesNotExistError)
      }
      return res.status(200).send({
        statusCode: 200,
        message: 'Successfully got a meal',
        data: meals
      })
    })
    .catch(() => {
      const serverError = new Error()
      serverError.message = 'Something went wrong, meals could not be fetched'
      return res.status(500).send(serverError)
    })
}

module.exports = {
  createMeal,
  editMeal,
  deleteMeal,
  viewMeal,
  uploadMealImage,
  createMealRating,
  changeMealRating,
  searchForMeals,
  viewAllMeals,
  viewAllVendorMeals
}
