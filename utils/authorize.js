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
  }
  roles = role
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
        if (!role.includes(decodedToken.data.role)) {
          return res.status(401).json({
            message: 'Unauthorized',
            statuscode: 401
          })
        }

        const { id } = decodedToken.data
        if (userTypes.includes(role[0])) {
          return req.Models.User.findOne({
            _id: id
          })
        }

        if (adminTypes.includes(role[0])) {
          return req.Models.Admin.findOne({
            _id: id
          })
        }
        // Verify that user is registered
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
      .catch(err => res.status(403).send({
        message: err.message,
        statusCode: 403
      }))
  }
}

module.exports = authorize
