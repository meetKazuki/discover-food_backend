const Paystack = require('paystack')
const config = require('../config')

const paystack = Paystack(config.paystackSecretKey)
/**
 * Make payment using paystack
 * @param {Object} paystackChargeData the configuration for the paystack service
 * @return {Promise} promise
 */
const paymentService = paystackChargeData => new Promise((resolve, reject) => {
  paystack.transactions.charge(paystackChargeData)
    .then((error, body) => {
      console.log(error)
      if (error) {
        return reject(error)
      }
      console.log(body)
      return resolve(body)
    })
})

module.exports = paymentService
