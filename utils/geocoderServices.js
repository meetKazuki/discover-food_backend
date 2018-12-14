const nodeGeocoder = require('node-geocoder')

/**
 * Convert address to longitude and latitude
 * @param {String} address address of location
 * @param {Object} options the configuration for the geocoder service
 * @return {Promise} promise
 */
const geocoderService = (address, options) => {
  const geocoder = nodeGeocoder(options)
  return new Promise((resolve, reject) => {
    geocoder.geocode(address)
      .then(res => resolve(res))
      .catch(err => reject(err))
  })
}

module.exports = geocoderService
