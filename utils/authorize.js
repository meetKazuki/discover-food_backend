const TokenManager = require('../utils/token')
const config = require('../config')

const authorize = (role) => {
  // roles param can be a single role string (e.g. Role.User or 'User')
  // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
  // if (typeof roles === 'string') {
  //   roles = [roles]
  // }

  return (req, res, next) => {
    const tokenManager = new TokenManager()

    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      const [bearer, token] = req.headers.authorization.split(' ')
      req.token = token
      req.bearer = bearer
    }

    tokenManager.verify(req.token, config.tokenSecret)
      .then((decodedToken) => {
        console.log('role data role', role, decodedToken.data)
        if (role !== decodedToken.data.role) {
          return res.status(401).json({ message: 'Unauthorized' })
        }

        const { id } = decodedToken.data
        // Verify that user is registered
        req.Models.User.findOne({
          _id: id
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
          .catch((err) => {
            res.status(err.statusCode).send(err.message)
          })
      })
      .catch(err => res.status(403).send({ message: err.message }))
  }
}

module.exports = authorize
