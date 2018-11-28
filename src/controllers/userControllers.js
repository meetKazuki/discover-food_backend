const TokenManager = require('../../utils/token')
const config = require('../../config')
const { hash } = require('../../utils/hash')
const {
  hasEmptyField,
  mongoModelValidation
} = require('../../utils/validator')

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
      const hashedPassword = hash(req.body.password)
      if (!registeredUser) {
        return req.Models.User.create({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          phone: req.body.phone,
          password: hashedPassword
        })
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

module.exports = {
  login,
  register
}
