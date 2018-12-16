const https = require('https')
const queryString = require('querystring')
const config = require('../config')

/**
 * Make payment using paystack
 * @param {Object} paystackChargeData the configuration for the paystack service
 * @return {Promise} promise
 */
const paymentService = paystackChargeData => new Promise((resolve, reject) => {
  const stringPayload = JSON.stringify(paystackChargeData)
  const requestDetails = {
    protocol: 'https:',
    hostname: 'api.paystack.co',
    method: 'POST',
    path: '/charge',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.paystackSecretKey}`
    }
  }

  const req = https.request(requestDetails, (res) => {
    const status = res.statusCode
    if (status === 200 || status === 201) {
      let body = ''
      res.on('data', (data) => {
        body += data
      })
      return res.on('end', () => {
        const parsed = JSON.parse(body)
        return resolve(parsed)
      })
    }
    const payStackError = new Error()
    payStackError.statusCode = status
    payStackError.message = res.statusMessage
    return reject(payStackError)
  })

  req.on('error', (e) => {
    reject(e)
  })

  req.write(stringPayload)

  req.end()
})


/**
 * Get list of banks
 * @return {Promise} promise
 */

const getBanks = () => new Promise((resolve, reject) => {
  const requestDetails = {
    protocol: 'https:',
    hostname: 'api.paystack.co',
    method: 'GET',
    path: '/bank?gateway=emandate&pay_with_bank=true'
  }


  const req = https.request(requestDetails, (res) => {
    const status = res.statusCode
    if (status === 200 || status === 201) {
      let body = ''
      res.on('data', (data) => {
        body += data
      })
      return res.on('end', () => {
        const parsed = JSON.parse(body)
        return resolve(parsed)
      })
    }
    const payStackError = new Error()
    payStackError.statusCode = status
    payStackError.message = res.statusMessage
    reject(payStackError)
  })

  req.on('error', (e) => {
    reject(e)
  })

  // End the request
  return req.end()
})

/**
 * Verify that a bank account is valid
 * @param {String} accountNumber customer account number
 * @param {String} bankCode code for bank of customer
 * @return {Promise} promise
 */

const verifyBankAccount = (accountNumber, bankCode) => new Promise((resolve, reject) => {
  const requestDetails = {
    protocol: 'https:',
    hostname: 'api.paystack.co',
    method: 'GET',
    path: `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.paystackSecretKey}`
    }
  }


  const req = https.request(requestDetails, (res) => {
    const status = res.statusCode
    if (status === 200 || status === 201) {
      let body = ''
      res.on('data', (data) => {
        body += data
      })
      return res.on('end', () => {
        const parsed = JSON.parse(body)
        return resolve(parsed)
      })
    }
    const payStackError = new Error()
    payStackError.statusCode = status
    payStackError.message = res.statusMessage
    reject(payStackError)
  })

  req.on('error', (e) => {
    reject(e)
  })

  // End the request
  return req.end()
})

/**
 * Verify if transaction was successful
 * @param {String} chargeReference the reference id from charge made
 * @return {Promise} promise
 */

const verifyTransaction = chargeReference => new Promise((resolve, reject) => {
  const requestDetails = {
    protocol: 'https:',
    hostname: 'api.paystack.co',
    method: 'GET',
    path: `/transaction/verify/${chargeReference}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.paystackSecretKey}`
    }
  }

  console.log('transaction', chargeReference)
  const req = https.request(requestDetails, (res) => {
    const status = res.statusCode
    if (status === 200 || status === 201) {
      let body = ''
      res.on('data', (data) => {
        body += data
      })
      return res.on('end', () => {
        const parsed = JSON.parse(body)
        return resolve(parsed)
      })
    }
    const payStackError = new Error()
    payStackError.statusCode = status
    payStackError.message = res.statusMessage
    reject(payStackError)
  })

  req.on('error', (e) => {
    reject(e)
  })

  // End the request
  return req.end()
})


module.exports = {
  paymentService,
  getBanks,
  verifyBankAccount,
  verifyTransaction
}
