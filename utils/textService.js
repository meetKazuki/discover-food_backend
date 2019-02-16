const http = require('http')

/**
 * Send text message
 * @param {Object} textMessageData the configuration for text message
 * @return {Promise} promise
 */
const sendTextMessage = textMessageData => new Promise((resolve, reject) => {
  const stringPayload = JSON.stringify(textMessageData)
  const requestDetails = {
    protocol: 'http:',
    hostname: 'quicksms1.com',
    method: 'POST',
    path: `/api/sendsms.php?username=${textMessageData.username}&password=${textMessageData.password}&sender=${textMessageData.sender}&message=${textMessageData.message}&recipient=${textMessageData.recipient}&report=${textMessageData.report}&convert=${textMessageData.convert}&route=${textMessageData.route}`
  }

  const req = http.request(requestDetails, (res) => {
    const status = res.statusCode
    if (status === 200 || status === 201) {
      let body = ''
      res.on('data', (data) => {
        body += data
      })
      return res.on('end', () => {
        console.log('body', body)
        // const parsed = JSON.parse(body)
        return resolve(body)
      })
    }
    let err = ''
    res.on('data', (data) => {
      err += data
    })
    return res.on('end', () => {
      const parsed = JSON.parse(err)
      const textMessageError = new Error()
      textMessageError.statusCode = status
      textMessageError.message = parsed.message
      return reject(textMessageError)
    })
  })

  req.on('error', (e) => {
    reject(e)
  })

  req.write(stringPayload)

  req.end()
})

module.exports = {
  sendTextMessage
}
