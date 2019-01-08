const TokenManager = require('../utils/token')
const config = require('../config')
const {
  USER,
  VENDOR,
  ADMIN,
  SUPERADMIN
} = require('../utils/constant')

const authorize = (role = []) => {
  let roles
  if (!Array.isArray(role)) {
    roles = [role]
  } else {
    roles = role
  }
  return (req, res, next) => {
    const tokenManager = new TokenManager()

    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      const [bearer, token] = req.headers.authorization.split(' ')
      req.token = token
      req.bearer = bearer
    }

    const userTypes = [USER, VENDOR]
    const adminTypes = [ADMIN, SUPERADMIN]
    tokenManager.verify(req.token, config.tokenSecret)
      .then((decodedToken) => {
        if (!roles.includes(decodedToken.data.role)) {
          const unAuthorizedError = new Error()
          unAuthorizedError.message = 'Unauthorized to perform action'
          unAuthorizedError.statusCode = 401
          return Promise.reject(unAuthorizedError)
        }

        const { id } = decodedToken.data
        if (userTypes.includes(roles[0])) {
          return req.Models.User.findOne({
            _id: id
          })
        }

        if (adminTypes.includes(roles[0])) {
          return req.Models.Admin.findOne({
            _id: id
          })
        }
      })
      .then((userExists) => {
        if (!userExists) {
          const userNotFound = new Error()
          userNotFound.message = 'User not registered'
          userNotFound.statusCode = 400
          return Promise.reject(userNotFound)
        }

        req.currentUser = userExists
        req.role = role
        next()
      })
      .catch(err => res.status(err.statusCode ? err.statusCode : 500).send({
        message: err.message ? err.message : 'Something went wrong',
        statusCode: err.statusCode ? err.statusCode : 500
      }))
  }
}

module.exports = authorize
