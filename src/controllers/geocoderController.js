const config = require('../../config')
const geocoderService = require('../../utils/geocoderServices')

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
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }
  geocoderService(req.body.address, {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: config.geocodingApiKey,
    formatter: null
  })
    .then(coord => res.status(200).send({
      data: coord,
      message: 'coordinates fetch successful',
      statusCode: 400
    }))
    .catch(err => res.status(400).send(err))
}

module.exports = {
  addressCoordinates
}
