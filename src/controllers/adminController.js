
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

  const isValidRole = [SUPERADMIN].indexOf(req.body.role.toLowerCase())

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
    .then((registeredAdmin) => {
      if (!registeredAdmin) {
        modifiedInputValues.role = [req.body.role.toLowerCase()]
        return req.Models.Admin.create(modifiedInputValues)
      }

      const adminAlreadyExists = new Error()
      adminAlreadyExists.message = 'User already registered as an admin'
      adminAlreadyExists.statusCode = 400
      return Promise.reject(adminAlreadyExists)
    })
    .then((adminRegisterSuccess) => {
      if (adminRegisterSuccess) {
        const registeredAdminObject = adminRegisterSuccess.toObject()
        delete registeredAdminObject.password
        const token = new TokenManager()
        return res.status(201).send({
          message: `User successfully created as ${modifiedInputValues.role}`,
          statusCode: 201,
          data: {
            token: token.create(
              {
                id: adminRegisterSuccess._id,
                role: req.body.role
              }, config.tokenSecret
            ),
            user: registeredAdminObject
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

const token = new TokenManager()

/**
 * Log in a registered admin in the application
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

      const registeredAdminObject = registeredUser.toObject()
      delete registeredAdminObject.password
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
          user: registeredAdminObject
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
 * Send an email to add as an admin
 * @param {Object} req request object
 * @param {String} req.body.email email to be added as admin
 * @param {Object} res response object
 *
 * @return {Object} response
 */
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
 * Register new user as an admin
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const createAdmin = (req, res) => {
  const fieldIsEmpty = hasEmptyField([
    'password', 'email', 'token'
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

/**
 * Get all users in the application
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} response
 */
const getAllUsers = (req, res) => req.Models.User.find({})
  .then(users => res.status(200).send({
    message: 'get users successful',
    statusCode: 200,
    data: users
  }))
  .catch(() => {
    const serverError = new Error()
    serverError.message = 'Something went wrong, could not get users'
    serverError.statusCode = 500
    return res.status(500).send(serverError)
  })

/**
 * Get all pending vendor requests
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} response
 */
const getAllPendingVendorRequest = (req, res) => req.Models.User.find({
  vendorRequest: 'pending'
})
  .then(users => res.status(200).send({
    message: 'get pending vendor requests successful',
    statusCode: 200,
    data: users
  }))
  .catch(() => {
    const serverError = new Error()
    serverError.message = 'Something went wrong, could not get users'
    serverError.statusCode = 500
    return res.status(500).send(serverError)
  })

/**
 * Remove admin from application
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} response
 */
const removeAdmin = (req, res) => {
  const { adminId } = req.params
  if (!adminId) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing admin id'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  req.Models.Admin.findOneAndDelete({
    _id: adminId
  })
    .then((deletedAdmin) => {
      if (!deletedAdmin) {
        const adminDoesNotExist = new Error()
        adminDoesNotExist.message = 'Admin does not exist'
        adminDoesNotExist.statusCode = 400
        return res.status(400).send(adminDoesNotExist)
      }

      res.status(201).send({
        message: 'Admin successfully deleted',
        statusCode: 201,
        data: deletedAdmin
      })
    })
}

/**
 * Get a single user in the application
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} response
 */
const getSingleUser = (req, res) => {
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
    .catch(() => {
      const serverError = new Error()
      serverError.message = 'Something went wrong could not get user'
      serverError.statusCode = 500
      return res.status(500).send(serverError)
    })
}

/**
 * An admin should be able to edit a user's profile
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
const activeUserVendorRole = (req, res) => {
  const { userId } = req.params

  if (!userId) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  req.Models.User.findOne({
    _id: userId
  })
    .then((registeredUser) => {
      if (!registeredUser) {
        const userNotRegisteredError = new Error()
        userNotRegisteredError.message = 'user is not registered in application'
        userNotRegisteredError.statusCode = 400
        return Promise.reject(userNotRegisteredError)
      }

      if (registeredUser.role.includes('vendor')) {
        const userAlreadyAVendorError = new Error()
        userAlreadyAVendorError.message = 'user is already a vendor'
        userAlreadyAVendorError.statusCode = 400
        return Promise.reject(userAlreadyAVendorError)
      }

      if (!registeredUser.vendorRequest) {
        const noVendorRequestError = new Error()
        noVendorRequestError.message = 'No vendor request for this user'
        noVendorRequestError.statusCode = 400
        return Promise.reject(noVendorRequestError)
      }

      let userRole = registeredUser.role ? registeredUser.role : []
      userRole = userRole.concat(['vendor'])
      return req.Models.User.findOneAndUpdate({
        _id: userId
      }, {
        role: userRole,
        vendorRequest: undefined
      }, {
        new: true
      })
    })
    .then(userUpdate => res.status(200).send({
      statusCode: 200,
      message: 'Successfully activated user vendor role',
      data: userUpdate.toObject()
    }))
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({
        message: err.message ? err.message : 'Something something went wrong',
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

  req.Models.Admin.findOne({
    email: req.body.email
  })
    .then((registeredUser) => {
      const forgotPasswordToken = crypto.randomBytes(20).toString('hex')
      return req.Models.Admin.findOneAndUpdate({ _id: registeredUser._id },
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
      userNotRegisteredError.message = 'Admin does not exist'
      return res.status(400).send(userNotRegisteredError)
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

  req.Models.Admin.findOne({
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

module.exports = {
  addAsAdminEmail,
  createAdmin,
  login,
  register,
  getAllUsers,
  getSingleUser,
  activeUserVendorRole,
  removeAdmin,
  getAllPendingVendorRequest,
  forgotPassword,
  resetPassword
}
