
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
  USER,
  VENDOR,
  ADMIN
} = require('../../utils/constant')

const token = new TokenManager()

const addAsAdminEmail = (req, res) => {
  const { currentUser } = req

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


module.exports = {
  addAsAdminEmail,
  createAdmin
}
