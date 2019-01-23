const https = require('https')
const config = require('../config')

/**
 * Make payment using paystack
 * @param {Object} paystackChargeData the configuration for the paystack service
 * @return {Promise} promise
 */
const createCharge = paystackChargeData => new Promise((resolve, reject) => {
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
    let err = ''
    res.on('data', (data) => {
      err += data
    })
    return res.on('end', () => {
      const parsed = JSON.parse(err)
      const payStackError = new Error()
      payStackError.statusCode = status
      payStackError.message = parsed.message
      return reject(payStackError)
    })
  })

  req.on('error', (e) => {
    reject(e)
  })

  req.write(stringPayload)

  req.end()
})


/**
 * Create payment recepient
 * @param {Object} recipientData the configuration for the paystack service
 * @return {Promise} promise
 */
const createTransferRecipient = recipientData => new Promise((resolve, reject) => {
  const stringPayload = JSON.stringify(recipientData)
  const requestDetails = {
    protocol: 'https:',
    hostname: 'api.paystack.co',
    method: 'POST',
    path: '/transferrecipient',
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
    let err = ''
    res.on('data', (data) => {
      err += data
    })
    return res.on('end', () => {
      const parsed = JSON.parse(err)
      const payStackError = new Error()
      payStackError.statusCode = status
      payStackError.message = parsed.message
      return reject(payStackError)
    })
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
    let err = ''
    res.on('data', (data) => {
      err += data
    })
    return res.on('end', () => {
      const parsed = JSON.parse(err)
      const payStackError = new Error()
      payStackError.statusCode = status
      payStackError.message = parsed.message
      return reject(payStackError)
    })
  })

  req.on('error', (e) => {
    reject(e)
  })

  // End the request
  return req.end()
})

/**
 * Verify card
 * @return {Promise} promise
 */

const verifyCardBin = cardBin => new Promise((resolve, reject) => {
  const requestDetails = {
    protocol: 'https:',
    hostname: 'api.paystack.co',
    method: 'GET',
    path: `/decision/bin/${cardBin}`
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
    let err = ''
    res.on('data', (data) => {
      err += data
    })
    return res.on('end', () => {
      const parsed = JSON.parse(err)
      const payStackError = new Error()
      payStackError.statusCode = status
      payStackError.message = parsed.message
      return reject(payStackError)
    })
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
    let err = ''
    res.on('data', (data) => {
      err += data
    })
    return res.on('end', () => {
      const parsed = JSON.parse(err)
      const payStackError = new Error()
      payStackError.statusCode = status
      payStackError.message = parsed.message
      return reject(payStackError)
    })
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
    let err = ''
    res.on('data', (data) => {
      err += data
    })
    return res.on('end', () => {
      const parsed = JSON.parse(err)
      const payStackError = new Error()
      payStackError.statusCode = status
      payStackError.message = parsed.message
      return reject(payStackError)
    })
  })

  req.on('error', (e) => {
    reject(e)
  })

  // End the request
  return req.end()
})


/**
 * Make payment using paystack
 * @param {Object} paystackChargeData the configuration for the paystack service
 * @return {Promise} promise
 */

const createRefund = transactionId => new Promise((resolve, reject) => {
  const stringPayload = JSON.stringify({ transaction: transactionId })
  const requestDetails = {
    protocol: 'https:',
    hostname: 'api.paystack.co',
    method: 'POST',
    path: '/refund',
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

    let err = ''
    res.on('data', (data) => {
      err += data
    })
    return res.on('end', () => {
      const parsed = JSON.parse(err)
      const payStackError = new Error()
      payStackError.statusCode = status
      payStackError.message = parsed.message
      return reject(payStackError)
    })
  })

  req.on('error', (e) => {
    reject(e)
  })

  req.write(stringPayload)

  req.end()
})

/**
 * Submit otp
 * @param {Object} paystackChargeData the configuration for the paystack service
 * @return {Promise} promise
 */

const submitOtp = (otp, referenceId) => new Promise((resolve, reject) => {
  const stringPayload = JSON.stringify({
    otp, reference: referenceId
  })
  const requestDetails = {
    protocol: 'https:',
    hostname: 'api.paystack.co',
    method: 'POST',
    path: '/charge/submit_otp',
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

    let err = ''
    res.on('data', (data) => {
      err += data
    })
    return res.on('end', () => {
      const parsed = JSON.parse(err)
      const payStackError = new Error()
      payStackError.statusCode = status
      payStackError.message = parsed.message
      return reject(payStackError)
    })
  })

  req.on('error', (e) => {
    reject(e)
  })

  req.write(stringPayload)

  req.end()
})

/**
 * create subaccount for fuudnet vendors
 * @param {Object} paystackSubaccountData the configuration for the paystack service
 * @return {Promise} promise
 */
const createSubaccount = paystackSubaccountData => new Promise((resolve, reject) => {
  const stringPayload = JSON.stringify(paystackSubaccountData)
  const requestDetails = {
    protocol: 'https:',
    hostname: 'api.paystack.co',
    method: 'POST',
    path: '/subaccount',
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
    let err = ''
    res.on('data', (data) => {
      err += data
    })
    return res.on('end', () => {
      const parsed = JSON.parse(err)
      const payStackError = new Error()
      payStackError.statusCode = status
      payStackError.message = parsed.message
      return reject(payStackError)
    })
  })

  req.on('error', (e) => {
    reject(e)
  })

  req.write(stringPayload)

  req.end()
})

/**
 * Initialize a transaction
 * @param {Object} transactionInfo the configuration for the paystack service
 * @return {Promise} promise
 */
const initializeTransaction = transactionInfo => new Promise((resolve, reject) => {
  const stringPayload = JSON.stringify(transactionInfo)
  const requestDetails = {
    protocol: 'https:',
    hostname: 'api.paystack.co',
    method: 'POST',
    path: '/transaction/initialize',
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
    let err = ''
    res.on('data', (data) => {
      err += data
    })
    return res.on('end', () => {
      const parsed = JSON.parse(err)
      const payStackError = new Error()
      payStackError.statusCode = status
      payStackError.message = parsed.message
      return reject(payStackError)
    })
  })

  req.on('error', (e) => {
    reject(e)
  })

  req.write(stringPayload)

  req.end()
})

module.exports = {
  createCharge,
  getBanks,
  verifyBankAccount,
  verifyTransaction,
  verifyCardBin,
  createRefund,
  submitOtp,
  createTransferRecipient,
  createSubaccount,
  initializeTransaction
}
