const config = require('../../config')
const geocoderService = require('../services/geocoderServices')

const {
  hasEmptyField
} = require('../../utils/validator')

const addressCoordinates = (req, res) => {
  const fieldIsEmpty = hasEmptyField([
    'address'
  ], req.body)

  if (fieldIsEmpty) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing required field'
    return res.status(400).send(missingFieldError)
  }
  geocoderService(req.body.address, {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: config.geocodingApiKey,
    formatter: null
  })
    .then(coord => res.status(200).send(coord))
    .catch(err => res.status(400).send(err))
}

module.exports = {
  addressCoordinates
}
