const jwt = require('jsonwebtoken')

/**
 * This takes care of token management
 * @param {Object} tokenData an object containing info to be hashed
 * @param {String} tokenSecret a string containing our token secrete
 * @return {*} null
 */
function TokenManager (tokenData, tokenSecret) {
  this.tokenData = tokenData
  this.tokenSecret = tokenSecret
}

/**
 * Create a token
 * @return {String} a string containing a hash of the token
 */
TokenManager.prototype.create = function () {
  return jwt.sign({
    exp: Math.floor(Date.now() / 1000) + (1 * 60),
    data: this.tokenData
  }, this.tokenSecret)
}

TokenManager.prototype.verify = function (token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, this.tokenSecret, (err, decoded) => {
      if (err) return reject(new Error(false))
      return resolve(decoded)
    })
  })
}

module.exports = TokenManager
