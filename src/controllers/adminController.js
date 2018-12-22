
const crypto = require('crypto')

const TokenManager = require('../../utils/token')
const EmailServiceManager = require('../../utils/emailService')
const config = require('../../config')
const { hash } = require('../../utils/hash')
const {
  hasEmptyField,
  mongoModelValidation
} = require('../../utils/validator')

const {
  ADMIN,
  SUPERADMIN
} = require('../../utils/constant')

const token = new TokenManager()

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

  const isValidRole = [ADMIN, SUPERADMIN].indexOf(req.body.role.toLowerCase())

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

  req.Models.Admin.findOne({
    email: req.body.email
  })
    .then((registeredUser) => {
      if (!registeredUser) {
        const userNotRegisteredError = new Error()
        userNotRegisteredError.message = 'User not currently registered as an admin in app'
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

const addAsAdminEmail = (req, res) => {
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

  const addAsAdminToken = token.create(
    {
      email: req.body.email
    }, config.tokenSecret
  )

  const messageHtmlContent = `
    <h3>Hello ${req.body.email}!</h3>
    <h4>Someone has requested a link to add you as admin.
    You can do this through the link below, which is valid for 24 hours.</h4>
    <a href='fuudnet/admin/${addAsAdminToken}'>Admin</a>
    <h4>Regards,</h4>
    <h3>The Fuudnet team</h3>
    `
  const messageSubject = 'Account role change request'
  const emailServiceManager = new EmailServiceManager({
    publicKey: config.mailjetPublicKey,
    secretKey: config.mailjetSecretKey,
    version: config.mailjetVersion
  }, {
    userEmail: req.body.email,
    senderEmail: config.mailjetEmailSender,
    userFirstName: '',
    messageHtmlContent,
    messageSubject
  })

  return emailServiceManager.sendEmail()
    .then(message => res.status(201).send({
      message: 'Email to request admin role for user sent',
      data: message,
      statusCode: 201,
      token: addAsAdminToken
    }))
    .catch(() => {
      const userUpdateError = new Error()
      userUpdateError.message = 'Could not send email for role change to admin'
      userUpdateError.statusCode = 500
      return res.status(500).send(userUpdateError)
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
const createAdmin = (req, res) => {
  const fieldIsEmpty = hasEmptyField([
    'password', 'email'
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
    'token'
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

  const combineInputsInObjReducer = (inputsObject, currentValue) => {
    const [key] = Object.keys(currentValue)
    inputsObject[key] = currentValue[key]
    return inputsObject
  }

  const modifiedInputValues = inputVals.reduce(combineInputsInObjReducer, {})

  let createdAdminObject
  token.verify(modifiedInputValues.token, config.tokenSecret)
    .then((decodedToken) => {
      if (!decodedToken.data.email) {
        const invalidToken = new Error()
        invalidToken.message = 'token must contain an email'
        invalidToken.statusCode = 401
        return Promise.reject(invalidToken)
      }

      return Promise.resolve(decodedToken.data)
    })
    .then(decodedToken => req.Models.Admin.findOne({
      email: decodedToken.email
    }))
    .then((registeredAdmin) => {
      if (!registeredAdmin) {
        modifiedInputValues.role = ['admin']
        return req.Models.Admin.create(modifiedInputValues)
      }

      const adminAlreadyExists = new Error()
      adminAlreadyExists.message = 'admin already exists'
      adminAlreadyExists.statusCode = 400
      return Promise.reject(adminAlreadyExists)
    })
    .then((createdAdmin) => {
      createdAdminObject = createdAdmin
      if (!createdAdmin) {
        const serverError = new Error()
        serverError.message = 'something went wrong creating admin'
        serverError.statusCode = 500
        return Promise.reject(serverError)
      }

      const messageHtmlContent = `
        <h3>Hello ${createdAdmin.email}!</h3>
        <h4>You have successfully been added as an admin</h4>
        <h4>Regards,</h4>
        <h3>The Fuudnet team</h3>
        `

      const messageSubject = 'Added as admin'
      const emailServiceManager = new EmailServiceManager({
        publicKey: config.mailjetPublicKey,
        secretKey: config.mailjetSecretKey,
        version: config.mailjetVersion
      }, {
        userEmail: createdAdmin.email,
        senderEmail: config.mailjetEmailSender,
        userFirstName: createdAdmin.firstName,
        messageHtmlContent,
        messageSubject
      })

      return emailServiceManager.sendEmail()
    })
    .then((message) => {
      createdAdminObject = createdAdminObject.toObject()
      delete createdAdminObject.password
      return res.status(201).send({
        message: 'User successfully created as admin',
        statusCode: 201,
        data: {
          token: token.create(
            {
              id: createdAdminObject._id,
            }, config.tokenSecret
          ),
          user: createdAdminObject,
          email: message
        }
      })
    })
    .catch(err => res.status(403).send({
      message: err.message,
      statusCode: err.statusCode
    }))
}

const getAllUsers = (req, res) => req.Models.User.find({})
  .then(users => res.status(200).send({
    message: 'get users successful',
    statusCode: 200,
    data: users
  }))
  .catch(() => {
    const serverError = new Error()
    serverError.message = 'Something went wrong, could not get user'
    serverError.statusCode = 500
    return res.status(500).send(serverError)
  })

const getAUser = (req, res) => {
  const { userId } = req.params
  if (!userId) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing user id'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }
  req.Models.User.findById(userId)
    .then(user => res.status(200).send({
      message: 'get user successful',
      statusCode: 200,
      data: user
    }))
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
  const fieldInputs = ['firstName', 'lastName', 'imageUrl', 'phone', 'location']
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

module.exports = {
  addAsAdminEmail,
  createAdmin,
  login,
  getAllUsers,
  getAUser
}
