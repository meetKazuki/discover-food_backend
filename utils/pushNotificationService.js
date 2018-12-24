const gcm = require('node-gcm')
const config = require('../config')


const pushNotificationService = (msg) => {
  const sender = new gcm.Sender(config.firebaseCloudMessagingApiKey)

  const message = new gcm.Message({
    data: { key1: msg }
  })

  const regTokens = [config.firebaseCloudMessagingRegWebToken]

  return new Promise((resolve, reject) => {
    sender.send(message, { registrationTokens: regTokens }, (err, response) => {
      if (err) return reject(err)
      return resolve(response)
    })
  })
}

module.exports = {
  pushNotificationService
}
