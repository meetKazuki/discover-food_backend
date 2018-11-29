const mailjet = require('node-mailjet')

/**
 * Manage email services for the application
 */
class EmailServiceManager {
  /**
   * @param {Object} emailConfig Contains all config information
   * for the email service
   * @param {string} emailConfig.publicKey - The public key for email service api.
   * @param {string} emailConfig.secretKey - The secret key for email service api.
   * @param {string} emailConfig.version - The version for email service api.
   * @param {Object} emailInfo Contains addition information for email
   * @param {String} emailInfo.userEmail The email of recipient
   * @param {String} emailInfo.senderEmail The email of sender
   * @param {String} emailInfo.userFirstName The firstName of email recepient
   * @param {String} emailInfo.messageHtmlContent the content of email message in html
   * @param {String} emailInfo.messageSubject the message subject
   * including message, Sender email, token if any
   */
  constructor (emailConfig, emailInfo) {
    this.emailConfig = emailConfig
    this.emailInfo = emailInfo
  }

  /**
   * @return {*} value
   */
  sendEmail () {
    const {
      publicKey,
      secretKey,
      version
    } = this.emailConfig

    const {
      senderEmail,
      userEmail,
      userFirstName,
      messageHtmlContent,
      messageSubject
    } = this.emailInfo

    return new Promise((resolve, reject) => {
      const mailRequest = mailjet.connect(publicKey, secretKey)
        .post('send', { version })
        .request({
          Messages: [
            {
              From: {
                Email: senderEmail,
                Name: 'Fuud Net'
              },
              To: [
                {
                  Email: userEmail,
                  Name: userFirstName
                }
              ],
              Subject: messageSubject,
              HTMLPart: messageHtmlContent
            }
          ]
        })
      mailRequest
        .then(result => resolve(result.body))
        .catch((err) => {
          const emailError = new Error()
          emailError.message = err.ErrorMessage
          emailError.statusCode = err.statusCode
          reject(emailError)
        })
    })
  }
}

module.exports = EmailServiceManager
