
/**
 * A vendor should be able to view his/her profile
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const viewProfile = (req, res) => {
  const { currentUser } = req

  req.Models.User.findOne({
    _id: currentUser._id
  })
    .then((vendor) => {
      if (!vendor) {
        const vendorNotFound = new Error()
        vendorNotFound.message = 'User not registered as vendor'
        vendorNotFound.statusCode = 400
        return res.status(400).send(vendorNotFound)
      }

      return res.status(200).send({
        message: 'get vendor successful',
        statusCode: 200,
        data: vendor
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
 * A vendor should be able to edit his/her profile
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const editProfile = (req, res) => {
  const { currentUser } = req
  const fieldInputs = [
    'firstName',
    'lastName',
    'imageUrl',
    'phone',
    'location',
    'userType',
    'businessName',
    'foodType',
    'address'
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

  // Create key value pairs for different inputs
  // combine all inputs into one object
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

  return req.Models.User.findOneAndUpdate({
    _id: currentUser._id
  }, modifiedInputValues, { new: true })
    .then((updatedUser) => {
      if (!updatedUser) {
        const userNotUpdatedError = new Error()
        userNotUpdatedError.message = `could not update ${req.role}`
        userNotUpdatedError.statusCode = 400
        return Promise.reject(userNotUpdatedError)
      }
      return req.Models.User.findOneAndUpdate({
        _id: updatedUser._id
      }, {
        modifiedInputValues
      }, {
        new: true
      })
    })
    .then(userUpdate => res.status(200).send({
      statusCode: 200,
      message: `Successfully updated ${req.role}`,
      data: userUpdate.toObject()
    }))
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({
        message: err.message ? err.message : 'Something something went wrong, could not to cart',
        statusCode: err.statusCode ? err.statusCode : 500
      }))
}
module.exports = {
  viewProfile,
  editProfile
}
