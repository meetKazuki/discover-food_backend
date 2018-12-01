const crypto = require('crypto')

const TokenManager = require('../../utils/token')
const EmailServiceManager = require('../../utils/emailService')
const config = require('../../config')
const { hash } = require('../../utils/hash')
const {
  hasEmptyField,
  mongoModelValidation
} = require('../../utils/validator')

// const { User } = require('../models')
// User.create({ name: 'terungwa' }, { validateBeforeSave: true })

/**
 * Register a new user into the application
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
      // const hashedPassword = hash(req.body.password)
      if (!registeredUser) {
        const user = new req.Models.User()
        user.firstName = req.body.firstName
        user.lastName = req.body.lastName
        user.email = req.body.email
        user.phone = req.body.phone
        user.password = req.body.password

        return user.save()
          .then((createdUser) => {
            const token = new TokenManager({
              id: createdUser._id
            }, config.tokenSecret)

            return res.status(201).send({
              message: 'User successfully registered',
              data: [{ token: token.create() }]
            })
          })
          .catch(createUserErr => res.status(422).send(createUserErr))
      }
      const userAlreadyExistsError = new Error()
      userAlreadyExistsError.message = 'User already exists'
      return res.status(400).send(userAlreadyExistsError)
    })
}

/**
 * Log in a registered user in the application
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
      const token = new TokenManager({
        id: registeredUser._id
      }, config.tokenSecret)
      if (hash(req.body.password) === registeredUser.password) {
        return res.status(201).send({
          message: 'User successfully logged in',
          data: token.create()
        })
      }

      const passwordNotCorrectError = new Error()
      passwordNotCorrectError.message = 'Password not correct'
      return res.status(400).send(passwordNotCorrectError)
    })
    .catch(() => {
      const userNotRegisteredError = new Error()
      userNotRegisteredError.message = 'User does not exist'
      return res.status(401).send(userNotRegisteredError)
    })
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
          data: message
        }))
        .catch(() => {
          const userUpdateError = new Error()
          userUpdateError.message = 'Could not send email for password change request'
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
    return res.status(400).send(missingFieldError)
  }

  if (req.body.password !== req.body.confirmPassword) {
    const confirmPasswordError = new Error()
    confirmPasswordError.message = 'Password does not match'
    return res.status(400).send(confirmPasswordError)
  }

  const errorMsg = mongoModelValidation(req.body, req.Models.User)
  if (errorMsg) {
    return res.status(400).send({
      message: errorMsg.message
    })
  }

  req.Models.User.findOne({
    resetPasswordToken: req.body.resetPasswordToken,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  })
    .then((registeredUser) => {
      registeredUser.password = hash(req.body.password)
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
          data: message
        }))
        .catch(() => {
          const userUpdateError = new Error()
          userUpdateError.message = 'Could not change password'
          return res.status(500).send(userUpdateError)
        })
    })
    .catch(() => {
      const resetTokenError = new Error()
      resetTokenError.message = 'Password reset token is invalid or has expired.'
      return res.status(400).send(resetTokenError)
    })
}

module.exports = {
  login,
  register,
  forgotPassword,
  resetPassword
}
