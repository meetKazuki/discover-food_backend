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
    'unitPriceType',
    'unitPriceAmount',
    'quantity',
    'timeToPrepare'
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

  req.Models.Vendor.findOne({
    user: currentUser._id
  })
    .then((vendor) => {
      if (!vendor) {
        const vendorNotFound = new Error()
        vendorNotFound.message = 'User not registered as vendor'
        vendorNotFound.statusCode = 400
        return res.status(400).send(vendorNotFound)
      }

      modifiedInputValues.vendor = vendor._id
      return req.Models.Meal.create(modifiedInputValues)
        .then((createdMeal) => {
          if (!createdMeal) {
            const serverError = new Error()
            serverError.message = 'Something went wrong, meal could not be created'
            serverError.statusCode = 500
            res.status(500).send(serverError)
          }

          return res.status(201).send({
            statusCode: 201,
            message: 'Meal successfully created',
            data: [createdMeal]
          })
        })
    })
    .catch(() => {
      const serverError = new Error()
      serverError.message = 'User not registered as vendor'
      serverError.statusCode = 500
      res.status(500).send(serverError)
    })
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
    'unitPriceType',
    'unitPriceAmount',
    'quantity',
    'timeToPrepare'
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

  req.Models.Vendor.findOne({
    user: currentUser._id
  })
    .then((vendor) => {
      if (!vendor) {
        const vendorNotFound = new Error()
        vendorNotFound.message = 'User not registered as vendor'
        vendorNotFound.statusCode = 400
        return res.status(400).send(vendorNotFound)
      }

      return req.Models.Meal.findOneAndUpdate({
        _id: mealId,
        vendor: vendor._id
      }, modifiedInputValues, { new: true })
    })
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

  req.Models.Vendor.findOne({
    user: currentUser._id
  })
    .then((vendor) => {
      if (!vendor) {
        const vendorNotFound = new Error()
        vendorNotFound.message = 'User not registered as vendor'
        vendorNotFound.statusCode = 400
        return res.status(400).send(vendorNotFound)
      }

      return req.Models.Meal.findOneAndDelete({
        _id: mealId,
        vendor: vendor._id
      })
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
  let vendor
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

  req.Models.Vendor.findOne({
    user: currentUser._id
  })
    .then((vendorExists) => {
      if (!vendorExists) {
        const vendorNotFound = new Error()
        vendorNotFound.message = 'User not registered as vendor'
        vendorNotFound.statusCode = 400
        return res.status(400).send(vendorNotFound)
      }

      vendor = vendorExists
      const createdImages = modifiedInputValues
        .mealImages.map(image => ({
          url: image
        }))

      return req.Models.MealImage.create(createdImages)
    })
    .then((savedImages) => {
      images = savedImages
      return req.Models.Meal.findOne({
        _id: mealId,
        vendor: vendor._id
      })
    })
    .then((updatedMeal) => {
      if (!updatedMeal) {
        const mealDoesNotExistError = new Error()
        mealDoesNotExistError.message = 'Meal does not exist'
        mealDoesNotExistError.statusCode = 400
        return res.status(400).send(mealDoesNotExistError)
      }

      if ((updatedMeal.mealImages.length + images.length) > 10) {
        const mealImagesNotGreaterThanTen = new Error()
        mealImagesNotGreaterThanTen.message = 'The images of a meal cannot be greater than 10'
        mealImagesNotGreaterThanTen.statusCode = 400
        return res.status(400).send(mealImagesNotGreaterThanTen)
      }

      images.forEach((image) => {
        updatedMeal.mealImages.push(image._id)
      })
      return updatedMeal.save()
    })
    .then(mealUpdate => req.Models.Meal.findOne({
      _id: mealUpdate._id
    })
      .populate('mealImages')
      .exec())
    .then(updatedMealImage => res.status(200).send({
      statusCode: 200,
      message: 'Successfully updated Meal',
      data: updatedMealImage
    }))
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

  req.Models.Meal.find({
    $text: {
      $search: modifiedInputValues.searchText
    }
    // location: {
    //   $near: modifiedInputValues.location ? modifiedInputValues : [],
    //   maxDist: 1000
    // }
  })
    // .populate('vendor')
    .populate({ path: 'vendor', populate: { path: 'user' } })
    .exec()
    .then((searchResult) => {
      res.status(200).send(searchResult)
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
  searchForMeals
}
