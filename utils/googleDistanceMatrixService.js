const distanceMatrix = require('google-distance-matrix')

const config = require('../config')

const getDurationBetweenLocations = (origins, destinations) => {
  distanceMatrix.key(config.distanceMatrixApiKey)
  distanceMatrix.units('imperial')
  distanceMatrix.mode('driving')
  return new Promise((resolve, reject) => {
    distanceMatrix.matrix(origins, destinations, (err, distances) => {
      if (err) {
        return reject(err)
      }
      if (!distances) {
        return reject(new Error('no distances'))
      }

      const distanceInfo = []
      if (distances.status === 'OK') {
        for (let i = 0; i < origins.length; i += 1) {
          for (let j = 0; j < destinations.length; j += 1) {
            const originAddress = distances.origin_addresses[i]
            const destinationAddress = distances.destination_addresses[j]
            if (distances.rows[0].elements[j].status === 'OK') {
              const distance = distances.rows[i].elements[j].distance.text
              const duration = distances.rows[i].elements[j].duration.text
              const distanceObject = {
                from: originAddress,
                to: destinationAddress,
                distance,
                duration
              }
              distanceInfo.push(distanceObject)
            } else {
              console.log(`${destinationAddress} is not reachable by land from ${originAddress}`)
            }
          }
        }
      }
      return resolve(distanceInfo)
    })
  })
}

module.exports = {
  getDurationBetweenLocations
}
