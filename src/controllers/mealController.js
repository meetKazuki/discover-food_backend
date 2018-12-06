// const mongoose = require('mongoose')
/**
 * A vendor should be able to create own meal
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const createMeal = (req, res) => {
  const { id } = req.currentUser

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
    return res.status(400).send(missingFieldError)
  }

  const combineInputsInObjReducer = (inputsObject, currentValue) => {
    const [key] = Object.keys(currentValue)
    inputsObject[key] = currentValue[key]
    return inputsObject
  }
  const modifiedInputValues = inputVals.reduce(combineInputsInObjReducer, {})

  req.Models.Vendor.findOne({
    user: id
  })
    .then((vendor) => {
      if (!vendor) {
        const vendorNotFound = new Error()
        vendorNotFound.message = 'User not registered as vendor'
        return res.status(400).send(vendorNotFound)
      }

      modifiedInputValues.vendor = vendor._id
      return req.Models.Meal.create(modifiedInputValues)
        .then((createdMeal) => {
          if (!createdMeal) {
            const serverError = new Error()
            serverError.message = 'Something went wrong, meal could not be created'
            res.status(500).send(serverError)
          }

          return res.status(201).send({
            message: 'Meal successfully created',
            data: [createdMeal]
          })
        })
    })
    .catch(() => {
      const serverError = new Error()
      serverError.message = 'User not registered as vendor'
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
  const { id } = req.currentUser
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

  if (!inputVals.length) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    return res.status(400).send(missingFieldError)
  }

  const combineInputsInObjReducer = (inputsObject, currentValue) => {
    const [key] = Object.keys(currentValue)
    inputsObject[key] = currentValue[key]
    return inputsObject
  }

  const modifiedInputValues = inputVals.reduce(combineInputsInObjReducer, {})

  req.Models.Vendor.findOne({
    user: id
  })
    .then((vendor) => {
      if (!vendor) {
        const vendorNotFound = new Error()
        vendorNotFound.message = 'User not registered as vendor'
        return res.status(400).send(vendorNotFound)
      }

      return req.Models.Meal.findOneAndUpdate({
        _id: mealId
      }, modifiedInputValues, { new: true })
        .then((updatedMeal) => {
          if (!updatedMeal) {
            const mealDoesNotExistError = new Error()
            mealDoesNotExistError.message = 'Meal does not exist'
            res.status(400).send(mealDoesNotExistError)
          }
          return res.status(200).send({
            message: 'Successfully updated Meal',
            data: updatedMeal.toObject()
          })
        })
    })
    .catch(() => {
      const serverError = new Error()
      serverError.message = 'Something went wrong, meal could not be updated'
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
  const { id } = req.currentUser
  const { mealId } = req.params

  req.Models.Vendor.findOne({
    user: id
  })
    .then((vendor) => {
      if (!vendor) {
        const vendorNotFound = new Error()
        vendorNotFound.message = 'User not registered as vendor'
        return res.status(400).send(vendorNotFound)
      }

      return req.Models.Meal.findOneAndDelete({
        _id: mealId
      })
        .then((deletedMeal) => {
          if (!deletedMeal) {
            const mealDoesNotExistError = new Error()
            mealDoesNotExistError.message = 'Meal does not exist'
            res.status(400).send(mealDoesNotExistError)
          }
          return res.status(200).send({
            message: 'Successfully deleted Meal',
            data: deletedMeal.toObject()
          })
        })
    })
    .catch(() => {
      const serverError = new Error()
      serverError.message = 'Something went wrong, meal could not be deleted'
      res.status(500).send(serverError)
    })
}

module.exports = {
  createMeal,
  editMeal,
  deleteMeal
}