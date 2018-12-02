const jwt = require('jsonwebtoken')

/**
 * This takes care of token management
 * @param {Object} tokenData an object containing info to be hashed
 * @param {String} tokenSecret a string containing our token secrete
 * @return {*} null
 */
class TokenManager {
  /**
   * Create a token
   * @return {String} a string containing a hash of the token
   * @param {String} tokenData
   * @param {String} tokenSecret
   */
  create (tokenData, tokenSecret) {
    return jwt.sign({
      exp: Math.floor(Date.now() / 1000) + (60 * 60),
      data: tokenData
    }, tokenSecret)
  }

  /**
   * Verify that a token is valid
   * @param {String} token token to verify
   * @param {String} tokenSecret
   * @return {Promise} promise
   */
  verify (token, tokenSecret) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, tokenSecret, (err, decoded) => {
        if (err) return reject(new Error('Failed to authenticate token.'))
        return resolve(decoded)
      })
    })
  }
}

module.exports = TokenManager
