const TokenManager = require('../../utils/token')
const config = require('../../config')
const { hash } = require('../../utils/hash')
const {
  hasEmptyField,
  mongoModelValidation
} = require('../../utils/validator')

/**
 * Register a user as a vendor into the application
 * If user does not already exist, create the user then register as a vendor
 * Ensures all fields are not empty
 * Ensures all field input satisfy validation rules
 * Ensures that a user that already exists is not registered
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const register = (req, res) => {
  const fieldIsEmpty = hasEmptyField([
    'firstName', 'lastName', 'phone', 'email', 'password'
  ], req.body)

  if (fieldIsEmpty) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    return res.status(400).send(missingFieldError)
  }

  const errorMsg = mongoModelValidation(req.body, req.Models.User)
  if (errorMsg) {
    return res.status(400).send({
      message: errorMsg.message
    })
  }

  req.Models.User.findOne({
    email: req.body.email
  })
    .then((registeredUser) => {
      if (!registeredUser) {
        const user = new req.Models.User()
        user.firstName = req.body.firstName
        user.lastName = req.body.lastName
        user.email = req.body.email
        user.phone = req.body.phone
        user.password = req.body.password
        user.role = 'User'
        return user.save()
          .then((createdUser) => {
            const vendor = new req.Models.Vendor()
            vendor.user = createdUser
            vendor.role = 'Vendor'

            return vendor.save()
          })
          .then((createdVendor) => {
            const token = new TokenManager()
            return res.status(201).send({
              message: 'Vendor successfully registered',
              data: [{
                token: token.create(
                  {
                    id: createdVendor._id,
                    role: createdVendor.role
                  }, config.tokenSecret
                )
              }]
            })
          })
      }

      req.Models.Vendor.findOne({
        user: registeredUser._id
      })
        .then((vendorExists) => {
          if (!vendorExists) {
            const vendor = new req.Models.Vendor()
            vendor.user = registeredUser
            vendor.role = 'Vendor'

            return vendor.save()
              .then((createdVendor) => {
                const token = new TokenManager()
                return res.status(201).send({
                  message: 'Vendor successfully registered',
                  data: [{
                    token: token.create(
                      {
                        id: createdVendor._id,
                        role: createdVendor.role
                      }, config.tokenSecret
                    )
                  }]
                })
              })
              .catch(() => {
                const couldNotRegisterVendor = new Error()
                couldNotRegisterVendor.message = 'Something went wrong, could not create vendor'
                return res.status(500).send(couldNotRegisterVendor)
              })
          }
          const vendorAlreadyExists = new Error()
          vendorAlreadyExists.message = 'Vendor already exists'
          return res.status(400).send(vendorAlreadyExists)
        })
    })
    .catch(createUserErr => res.status(500).send(createUserErr))
}

/**
 * Log in a registered user as a vendor
 * Ensures all fields are not empty
 * Ensures all field input satisfy validation rules
 * Ensures that a user that is not registered is not logged in
 * Ensures that user has entered the correct password
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const login = (req, res) => {
  const fieldIsEmpty = hasEmptyField([
    'email', 'password'
  ], req.body)

  if (fieldIsEmpty) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    return res.status(400).send(missingFieldError)
  }

  const errorMsg = mongoModelValidation(req.body, req.Models.User)
  if (errorMsg) {
    return res.status(400).send({
      message: errorMsg.message
    })
  }

  req.Models.User.findOne({
    email: req.body.email
  })
    .then((registeredUser) => {
      const token = new TokenManager()
      if (hash(req.body.password) === registeredUser.password) {
        return req.Models.Vendor.findOne({
          user: registeredUser._id
        })
          .then((vendorExists) => {
            if (vendorExists) {
              return res.status(201).send({
                message: 'User successfully logged in as a vendor',
                data: [{
                  token: token.create(
                    {
                      id: registeredUser._id,
                      role: registeredUser.role
                    }, config.tokenSecret
                  )
                }]
              })
            }
            const vendorLoginError = new Error()
            vendorLoginError.message = 'User does not exist as a vendor'
            return res.status(400).send(vendorLoginError)
          })
          .catch(() => res.status(500).send(new Error('Something went wrong, could not login vendor')))
      }

      const passwordNotCorrectError = new Error()
      passwordNotCorrectError.message = 'Password not correct'
      return res.status(400).send(passwordNotCorrectError)
    })
    .catch(() => {
      const userNotRegisteredError = new Error()
      userNotRegisteredError.message = 'User does not exist'
      return res.status(400).send(userNotRegisteredError)
    })
}

/**
 * A vendor should be able to view his/her profile
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const viewProfile = (req, res) => {
  const { currentUser } = req
  req.Models.Vendor.findOne({
    user: currentUser._id
  })
    .populate('user')
    .exec()
    .then((vendor) => {
      if (!vendor) {
        const vendorNotFound = new Error()
        vendorNotFound.message = 'User not registered as vendor'
        return res.status(400).send(vendorNotFound)
      }

      return res.status(200).send({
        message: 'get vendor successful',
        data: vendor
      })
    })
    .catch(() => {
      const serverError = new Error()
      serverError.message = 'User not registered as vendor'
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
  const fieldInputs = ['firstName', 'lastName', 'imageUrl', 'phone', 'location', 'address']
  const inputVals = fieldInputs.filter(fieldInput => req.body[fieldInput])
    .map(value => ({
      [value]: req.body[value]
    }))

  if (!inputVals.length) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
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
  req.Models.User.findOneAndUpdate({
    _id: currentUser._id
  }, modifiedInputValues, { new: true })
    .then(updatedUser => res.status(200).send({
      message: 'Successfully updated user',
      data: updatedUser.toObject()
    }))
    .catch(err => res.status(400).send(err))
}
module.exports = {
  login,
  register,
  viewProfile,
  editProfile
}
