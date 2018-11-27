const bcrypt = require('bcrypt')

const TokenManager = require('../../utils/token')
const config = require('../../config')
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
exports.register = function (req, res) {
  const fieldIsEmpty = hasEmptyField([
    'firstName', 'lastName', 'phone', 'email', 'password'
  ], req.body)

  if (fieldIsEmpty) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    return res.status(400).send(missingFieldError)
  }

  const errorMsg = mongoModelValidation(req.body, req.User)
  if (errorMsg) {
    return res.status(400).send({
      message: errorMsg.message
    })
  }

  req.User.findOne({
    email: req.body.email
  })
    .then((registeredUser) => {
      const hashedPassword = bcrypt.hashSync(req.body.password, 10)
      if (!registeredUser) {
        return req.User.create({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          phone: req.body.phone,
          password: hashedPassword
        })
          .then((createdUser) => {
            const token = new TokenManager({
              id: createdUser._id
            }, config.secret)

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

// exports.login = function () {

// }
