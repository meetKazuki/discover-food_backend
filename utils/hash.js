const crypto = require('crypto')
const config = require('../config')

/**
 * Create a SHA256 hash
 * @param {String} str
 * @return {String|Boolean} hashed value or false
 */
exports.hash = (str) => {
  console.log('password', str)
  if (typeof str === 'string' && str.length > 0) {
    const passwordHash = crypto.createHmac('sha256', config.hashSecret)
      .update(str).digest('hex')

    return passwordHash
  }

  return false
}
