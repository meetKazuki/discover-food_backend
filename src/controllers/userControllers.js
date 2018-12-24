const crypto = require('crypto')

const TokenManager = require('../../utils/token')
const EmailServiceManager = require('../../utils/emailService')
// const {
//   pushNotificationService
// } = require('../../utils/pushNotificationService')
const config = require('../../config')
const { hash } = require('../../utils/hash')
const {
  hasEmptyField,
  mongoModelValidation
} = require('../../utils/validator')

const {
  USER,
  VENDOR
} = require('../../utils/constant')

/**
 * Register a new user into the application
 * Ensures all fields are not empty
 * Ensures all field input satisfy validation rules
 * Ensures that a user that already exists is not registered
 * check in data if user is registered
 * If registered check if role is vendor
 * If a vendor return an error vendor already registered
 * If not vendor but user then update role as both user and vendor
 * If not user then register as a vendor
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const register = (req, res) => {
  const fieldIsEmpty = hasEmptyField([
    'firstName',
    'lastName',
    'phone',
    'email',
    'password',
    'role'
  ], req.body)

  if (fieldIsEmpty) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  const inputVals = [
    'firstName',
    'lastName',
    'phone',
    'email',
    'password',
    'role'
  ].filter(fieldInput => req.body[fieldInput])
    .map(value => ({
      [value]: req.body[value]
    }))

  const errorMsg = mongoModelValidation(req.body, req.Models.User)
  if (errorMsg) {
    return res.status(400).send({
      message: errorMsg.message,
      statusCode: 400
    })
  }

  const isValidRole = [USER, VENDOR].indexOf(req.body.role.toLowerCase())

  if (isValidRole < 0) {
    const invalidRoleError = new Error()
    invalidRoleError.message = 'This role is not yet a valid role'
    invalidRoleError.statusCode = 400
    return res.status(400).send(invalidRoleError)
  }

  const combineInputsInObjReducer = (inputsObject, currentValue) => {
    const [key] = Object.keys(currentValue)
    inputsObject[key] = currentValue[key]
    return inputsObject
  }

  const modifiedInputValues = inputVals.reduce(combineInputsInObjReducer, {})

  req.Models.User.findOne({
    email: req.body.email
  })
    .then((registeredUser) => {
      if (!registeredUser && req.body.role === 'user') {
        modifiedInputValues.role = [req.body.role.toLowerCase()]
        return req.Models.User.create(modifiedInputValues)
      }

      if (!registeredUser && req.body.role === 'vendor') {
        delete modifiedInputValues.role
        modifiedInputValues.vendorRequest = 'pending'
        return req.Models.User.create(modifiedInputValues)
      }

      const roleExists = registeredUser.role
        .indexOf(modifiedInputValues.role.toLowerCase())
      if (roleExists > -1) {
        const UserIsAlreadyRegisteredForRole = new Error()
        UserIsAlreadyRegisteredForRole.message = `User is already registered as a ${modifiedInputValues.role}`
        UserIsAlreadyRegisteredForRole.statusCode = 400
        return Promise.reject(UserIsAlreadyRegisteredForRole)
      }

      const addedRole = registeredUser.role
        .concat([modifiedInputValues.role])

      return req.Models.User.findOneAndUpdate({
        _id: registeredUser._id
      }, {
        role: addedRole
      },
      {
        new: true
      })
    })
    .then((userRegisterSuccess) => {
      if (userRegisterSuccess) {
        const registeredUserObject = userRegisterSuccess.toObject()
        delete registeredUserObject.password
        const token = new TokenManager()
        return res.status(201).send({
          message: `User successfully created as ${modifiedInputValues.role}`,
          statusCode: 201,
          data: {
            token: token.create(
              {
                id: userRegisterSuccess._id,
                role: req.body.role
              }, config.tokenSecret
            ),
            user: registeredUserObject
          }
        })
      }
    })
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({
        message: err.message ? err.message : 'Something something went wrong',
        statusCode: err.statusCode ? err.statusCode : 500
      }))
}

/**
 * Log in a registered user in the application
 * Ensures all fields are not empty
 * Ensures all field input satisfy validation rules
 * Ensures that a user that is not registered is not logged in
 * Ensures that user has entered the correct password
 * check if current exists else error
 * check if current exists as role else error
 * login user as current role
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const login = (req, res) => {
  const fieldIsEmpty = hasEmptyField([
    'email',
    'password',
    'role'
  ], req.body)

  if (fieldIsEmpty) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  const inputVals = [
    'email',
    'password',
    'role'
  ].filter(fieldInput => req.body[fieldInput])
    .map(value => ({
      [value]: req.body[value]
    }))

  const errorMsg = mongoModelValidation(req.body, req.Models.User)
  if (errorMsg) {
    return res.status(400).send({
      message: errorMsg.message,
      statusCode: 400
    })
  }

  const isValidRole = [USER, VENDOR].indexOf(req.body.role.toLowerCase())

  if (isValidRole < 0) {
    const invalidRoleError = new Error()
    invalidRoleError.message = 'This role is not yet a valid role'
    invalidRoleError.statusCode = 400
    return res.status(400).send(invalidRoleError)
  }

  const combineInputsInObjReducer = (inputsObject, currentValue) => {
    const [key] = Object.keys(currentValue)
    inputsObject[key] = currentValue[key]
    return inputsObject
  }

  const modifiedInputValues = inputVals.reduce(combineInputsInObjReducer, {})

  req.Models.User.findOne({
    email: req.body.email
  })
    .then((registeredUser) => {
      if (!registeredUser) {
        const userNotRegisteredError = new Error()
        userNotRegisteredError.message = 'User not current registered in app'
        userNotRegisteredError.statusCode = 401
        return Promise.reject(userNotRegisteredError)
      }

      const roleExists = registeredUser.role
        .indexOf(modifiedInputValues.role.toLowerCase())
      if (roleExists < 0) {
        const userIsNotRegisteredForRole = new Error()
        userIsNotRegisteredForRole.message = `User is not registered as a ${modifiedInputValues.role}`
        userIsNotRegisteredForRole.statusCode = 400
        return Promise.reject(userIsNotRegisteredForRole)
      }
      const token = new TokenManager()
      if (hash(req.body.password) !== registeredUser.password) {
        const passwordDoesNotMatchError = new Error()
        passwordDoesNotMatchError.message = 'password does not match record'
        passwordDoesNotMatchError.statusCode = 400
        return Promise.reject(passwordDoesNotMatchError)
      }

      const registeredUserObject = registeredUser.toObject()
      delete registeredUserObject.password
      return res.status(201).send({
        message: 'User successfully logged in',
        statusCode: 201,
        data: {
          token: token.create(
            {
              id: registeredUser._id,
              role: req.body.role
            }, config.tokenSecret
          ),
          user: registeredUserObject
        }
      })
    })
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({
        message: err.message ? err.message : 'Something something went wrong, could not to cart',
        statusCode: err.statusCode ? err.statusCode : 500
      }))
}

/**
 * Send an email to a user that has forgotten authenticaton password
 * Ensures all fields are not empty
 * Ensures all field input satisfy validation rules
 * Ensures that the user is already registered in the application
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const forgotPassword = (req, res) => {
  const fieldIsEmpty = hasEmptyField([
    'email'
  ], req.body)

  if (fieldIsEmpty) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    missingFieldError.statusCode = 400
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
      const forgotPasswordToken = crypto.randomBytes(20).toString('hex')
      return req.Models.User.findOneAndUpdate({ _id: registeredUser._id },
        {
          resetPasswordToken: forgotPasswordToken,
          resetPasswordExpires: Date.now() + 86400000
        },
        { upsert: true, new: true })
        .then(() => {
          const messageHtmlContent = `
          <h3>Hello ${registeredUser.email}!</h3>
          <h4>Someone has requested a link to change your password.
          You can do this through the link below, which is valid for 24 hours.</h4>
          <a href='fuudnet/reset-password/${forgotPasswordToken}'>Change my password</a>
          <h4>If you didn't request this, please ignore this email.
            Your password won't change until you access the link above and create a new one.
          </h4>
          <h4>Regards,</h4>
          <h3>The Fuudnet team</h3>
          `

          const messageSubject = 'Your password change request'
          const emailServiceManager = new EmailServiceManager({
            publicKey: config.mailjetPublicKey,
            secretKey: config.mailjetSecretKey,
            version: config.mailjetVersion
          }, {
            userEmail: registeredUser.email,
            senderEmail: config.mailjetEmailSender,
            userFirstName: registeredUser.firstName,
            messageHtmlContent,
            messageSubject
          })

          return emailServiceManager.sendEmail()
        })
        .then(message => res.status(201).send({
          message: 'Email to request password change successfully sent',
          data: message,
          statusCode: 201,
          token: forgotPasswordToken
        }))
        .catch(() => {
          const userUpdateError = new Error()
          userUpdateError.message = 'Could not send email for password change request'
          userUpdateError.statusCode = 500
          return res.status(500).send(userUpdateError)
        })
    })
    .catch(() => {
      const userNotRegisteredError = new Error()
      userNotRegisteredError.message = 'User does not exist'
      return res.status(401).send(userNotRegisteredError)
    })
}

/**
 * Send an email to a user that has successfully changed password
 * Send appropriate error message if action is not successful
 * Ensures all fields are not empty
 * Ensures all field input satisfy validation rules
 * Ensures that the new password is exactly what the user wants (must match)
 * Ensures that the token is valid and has not expired
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const resetPassword = (req, res) => {
  const fieldIsEmpty = hasEmptyField([
    'password', 'confirmPassword', 'resetPasswordToken'
  ], req.body)

  if (fieldIsEmpty) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  if (req.body.password !== req.body.confirmPassword) {
    const confirmPasswordError = new Error()
    confirmPasswordError.message = 'Password does not match'
    confirmPasswordError.statusCode = 400
    return res.status(400).send(confirmPasswordError)
  }

  const errorMsg = mongoModelValidation(req.body, req.Models.User)
  if (errorMsg) {
    return res.status(400).send({
      message: errorMsg.message,
      statusCode: 400
    })
  }

  req.Models.User.findOne({
    resetPasswordToken: req.body.resetPasswordToken,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  })
    .then((registeredUser) => {
      registeredUser.password = req.body.password
      registeredUser.resetPasswordToken = undefined
      registeredUser.resetPasswordExpires = undefined
      registeredUser.save()
        .then(() => {
          const messageHtmlContent = `
          <h3>Hello ${registeredUser.email}!</h3>
          <h4>You have successfully changed your password. You can now login with the new password</h4>
          <h4>Regards,</h4>
          <h3>The Fuudnet team</h3>
          `

          const messageSubject = 'Your password Reset'
          const emailServiceManager = new EmailServiceManager({
            publicKey: config.mailjetPublicKey,
            secretKey: config.mailjetSecretKey,
            version: config.mailjetVersion
          }, {
            userEmail: registeredUser.email,
            senderEmail: config.mailjetEmailSender,
            userFirstName: registeredUser.firstName,
            messageHtmlContent,
            messageSubject
          })

          return emailServiceManager.sendEmail()
        })
        .then(message => res.status(201).send({
          message: 'Email to request password change successfully sent',
          data: message,
          statusCode: 201
        }))
        .catch(err => res.status(500).send(err))
    })
    .catch(() => {
      const resetTokenError = new Error()
      resetTokenError.message = 'Password reset token is invalid or has expired.'
      resetTokenError.statusCode = 400
      return res.status(400).send(resetTokenError)
    })
}

/**
 * A user should be able to view his/her profile
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const viewProfile = (req, res) => {
  const { currentUser } = req
  res.status(200).send({
    message: 'current user successfully found',
    statusCode: 200,
    data: [
      currentUser.toObject()
    ]
  })
}

/**
 * A user should be able to edit his/her profile
 *
 * @param {Object} req request object
 * @param {string} req.body.firstName - The first name of the user.
 * @param {string} req.body.lastName - The last name of the user.
 * @param {string} req.body.imageUrl - The image url of the user.
 * @param {string} req.body.phone - The phone number of the user.
 * @param {Object} req.body.location - The location of the user.
 * @param {Object} req.body.location.latitude - The location latitude of the user.
 * @param {Object} req.body.location.longitude - The location longitude of the user.
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
    'password',
    'location']
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

  if (modifiedInputValues.password) {

  }

  return req.Models.User.findOneAndUpdate({
    _id: currentUser._id
  }, modifiedInputValues, { new: true })
    .then((updatedUser) => {
      if (!updatedUser) {
        const userNotUpdatedError = new Error()
        userNotUpdatedError.message = 'Something went wrong, user could not be updated'
        userNotUpdatedError.statusCode = 500
        return Promise.reject(userNotUpdatedError)
      }

      return req.Models.User.findById(updatedUser._id)
    })
    .then(userUpdate => res.status(200).send({
      statusCode: 200,
      message: 'Successfully updated user',
      data: userUpdate.toObject()
    }))
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({
        message: err.message ? err.message : 'Something something went wrong',
        statusCode: err.statusCode ? err.statusCode : 500
      }))
}

/**
 * A user can add a vendor as favorite
 * A user cannot add self as a favorite
 * A user cannot add a vendor more than once as favorite
 * If a vendor already exists as a favorite, it will be removed on adding twice
 * @param {Object} req
 * @param {Object} res
 *
 * @return {Object} res response object
 */
const addVendorToFavorites = (req, res) => {
  const { currentUser } = req
  const { selectedVendorId } = req.body

  if (!selectedVendorId) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  if (req.role !== 'user') {
    const mustBeUserError = new Error()
    mustBeUserError.message = 'role must be user to add vendor'
    mustBeUserError.statusCode = 400
    return res.status(400).send(mustBeUserError)
  }

  if (currentUser._id === selectedVendorId) {
    const addSelfAsFavError = new Error()
    addSelfAsFavError.message = 'Cannot not add yourself as a favorite'
    addSelfAsFavError.statusCode = 400
    return res.status(400).send(addSelfAsFavError)
  }

  return req.Models.User.findOne({ _id: selectedVendorId })
    .then((vendorExists) => {
      if (vendorExists.role.includes('vendor')) {
        const vendorIsAFav = currentUser.favoriteVendors.indexOf(vendorExists._id)
        if (vendorIsAFav > -1) {
          const vendorNotFavError = new Error()
          vendorNotFavError.message = 'vendor is already a favorite'
          vendorNotFavError.statusCode = 500
          return Promise.reject(vendorNotFavError)
        }
        return req.Models.User.findOneAndUpdate({
          _id: currentUser._id
        }, {
          favoriteVendors: currentUser.favoriteVendors.concat([vendorExists._id])
        }, { new: true })
      }

      const currentUserNotOFUserRole = new Error()
      currentUserNotOFUserRole.message = 'selected user is not a vendor'
      currentUserNotOFUserRole.statusCode = 400
      return Promise.reject(currentUserNotOFUserRole)
    })
    .then(updatedUser => res.status(200).send({
      statusCode: 200,
      message: 'favorite vendor successfully added',
      data: [updatedUser]
    }))
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({
        message: err.message ? err.message : 'Something something went wrong',
        statusCode: err.statusCode ? err.statusCode : 500
      }))
}

/**
 * A user can add a vendor as favorite
 * A user cannot add self as a favorite
 * A user cannot add a vendor more than once as favorite
 * If a vendor already exists as a favorite, it will be removed on adding twice
 * @param {Object} req
 * @param {Object} res
 *
 * @return {Object} res response object
 */
const removeVendorFromFavorites = (req, res) => {
  const { currentUser } = req
  const { selectedVendorId } = req.body

  if (!selectedVendorId) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  if (req.role !== 'user') {
    const mustBeUserError = new Error()
    mustBeUserError.message = 'role must be user to add vendor'
    mustBeUserError.statusCode = 400
    return res.status(400).send(mustBeUserError)
  }

  if (currentUser._id === selectedVendorId) {
    const addSelfAsFavError = new Error()
    addSelfAsFavError.message = 'Cannot not add yourself as a favorite'
    addSelfAsFavError.statusCode = 400
    return res.status(400).send(addSelfAsFavError)
  }

  return req.Models.User.findOne({ _id: selectedVendorId })
    .then((vendorExists) => {
      if (vendorExists.role.includes('vendor')) {
        const vendorIsAFav = currentUser.favoriteVendors.indexOf(vendorExists._id)

        if (vendorIsAFav > -1) {
          return req.Models.User.findOneAndUpdate({
            _id: currentUser._id
          }, {
            favoriteVendors: currentUser
              .favoriteVendors
              .filter(item => item.toString() !== vendorExists._id.toString())
          }, { new: true })
        }
        const userIsNotAlreadyFavorite = new Error()
        userIsNotAlreadyFavorite.message = 'user not yet a favorite, cannot be removed'
        userIsNotAlreadyFavorite.statusCode = 400
        return Promise.reject(userIsNotAlreadyFavorite)
      }

      const currentUserNotOFUserRole = new Error()
      currentUserNotOFUserRole.message = 'selected user is not a vendor'
      currentUserNotOFUserRole.statusCode = 400
      return Promise.reject(currentUserNotOFUserRole)
    })
    .then(updatedUser => res.status(200).send({
      statusCode: 200,
      message: 'favorite vendor successfully removed',
      data: [updatedUser]
    }))
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({
        message: err.message ? err.message : 'Something something went wrong',
        statusCode: err.statusCode ? err.statusCode : 500
      }))
}

const viewFavoriteVendor = (req, res) => {
  const { currentUser } = req
  req.Models.User.findOne({ _id: currentUser._id })
    .populate('favoriteVendors')
    .exec()
    .then(vendor => res.status(200).send({
      statusCode: 200,
      message: 'get favorite vendors successfully',
      data: vendor.favoriteVendors
    }))
    .catch(() => res.status(400).send({
      message: 'could not get user favorite vendor',
      statusCode: 400
    }))
}

module.exports = {
  login,
  register,
  forgotPassword,
  resetPassword,
  viewProfile,
  editProfile,
  viewFavoriteVendor,
  addVendorToFavorites,
  removeVendorFromFavorites
}
