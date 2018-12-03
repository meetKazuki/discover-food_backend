const TokenManager = require('../utils/token')
const config = require('../config')

const authorize = (roles = []) => {
  // roles param can be a single role string (e.g. Role.User or 'User')
  // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
  if (typeof roles === 'string') {
    roles = [roles]
  }

  return (req, res, next) => {
    const tokenManager = new TokenManager()

    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      const [bearer, token] = req.headers.authorization.split(' ')
      req.token = token
      req.bearer = bearer
    }

    tokenManager.verify(req.token, config.tokenSecret)
      .then((decodedToken) => {
        if (roles.length && !roles.includes(decodedToken.data.role)) {
          return res.status(401).json({ message: 'Unauthorized' })
        }
        req.currentUser = decodedToken.data
        next()
      })
      .catch(err => res.status(403).send({ message: err.message }))
  }
}

module.exports = authorize
