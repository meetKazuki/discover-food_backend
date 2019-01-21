const crypto = require('crypto')
const config = require('../../config')

const recieveWebhook = (req, res) => {
  // validate event
  const hash = crypto.createHmac('sha512', config.paystackSecretKey)
    .update(JSON.stringify(req.body))
    .digest('hex')
  console.log('req headers', req.headers, req.body)
  if (hash === req.headers['x-paystack-signature']) {
  // Retrieve the request's body
    const event = req.body
    // Do something with event
  }
  res.status(200).send({
    message: 'Ok'
  })
}

module.exports = {
  recieveWebhook
}
