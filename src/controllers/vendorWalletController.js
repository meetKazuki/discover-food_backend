const {
  createSubaccount
} = require('../../utils/paymentService')

const {
  TRANSFER,
  WITHDRAWAL,
  DEPOSIT
} = require('../../utils/constant')

/**
 * Create a vendor wallet
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const createVendorWallet = (req, res) => {
  const { currentUser } = req
  const inputVals = [
    'businessName',
    'settlementBank',
    'accountNumber'
  ].filter(fieldInput => req.body[fieldInput])
    .map(value => ({
      [value]: req.body[value]
    }))

  if (!inputVals.length) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Field is missing'
    missingFieldError.statusCode = 400
    return res.status(400).send(missingFieldError)
  }

  const reducer = (accumulator, currentValue) => {
    const [key] = Object.keys(currentValue)
    accumulator[key] = currentValue[key]
    return accumulator
  }
  const modifiedInputValues = inputVals.reduce(reducer, {})

  modifiedInputValues.email = currentUser.email

  let subAccountInfo
  modifiedInputValues.business_name = modifiedInputValues.businessName
  delete modifiedInputValues.businessName
  modifiedInputValues.settlement_bank = modifiedInputValues.settlementBank
  delete modifiedInputValues.settlementBank
  modifiedInputValues.account_number = modifiedInputValues.accountNumber
  delete modifiedInputValues.accountNumber

  modifiedInputValues.percentage_charge = 18.2

  createSubaccount(modifiedInputValues)
    .then((subAccountCreated) => {
      if (!subAccountCreated) {
        const subAccountCreatedFailedError = new Error()
        subAccountCreatedFailedError.message = 'subaccount not created'
        subAccountCreatedFailedError.statusCode = 400
        return Promise.reject(subAccountCreatedFailedError)
      }
      subAccountInfo = subAccountCreated
      return req.Models.VendorWallet.findOne({
        user: currentUser._id
      })
    })
    .then((vendorWalletExists) => {
      if (!vendorWalletExists) {
        return req.Models.VendorWallet.create({
          amount: modifiedInputValues.amount,
          user: currentUser._id,
          subAccountCode: subAccountInfo.data.subaccount_code
        })
      }

      const vendorWalletAlreadyExistsError = new Error()
      vendorWalletAlreadyExistsError.message = 'wallet already exists error'
      vendorWalletAlreadyExistsError.statusCode = 400
      return Promise.reject(vendorWalletAlreadyExistsError)
    })
    .then((vendorWallet) => {
      if (!vendorWallet) {
        const walletCreateError = new Error()
        walletCreateError.message = 'could not make deposit in wallet'
        walletCreateError.statusCode = 400
        return Promise.reject(walletCreateError)
      }
      return res.status(201)
        .send({
          statusCode: 201,
          message: 'wallet successfully created',
          data: {
            vendorWallet
          }
        })
    })
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({
        message: err.message ? err.message : 'Something something went wrong, could not create order'
      }))
}

/**
 * Get a vendor wallet
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const getVendorWallet = (req, res) => {
  const { currentUser } = req
  req.Models.VendorWallet.findOne({
    user: currentUser._id
  })
    .populate('user', '-password')
    .exec()
    .then((walletExists) => {
      if (!walletExists) {
        const walletDoesNotExistError = new Error()
        walletDoesNotExistError.message = 'wallet does not exist'
        walletDoesNotExistError.statusCode = 400

        return Promise.reject(walletDoesNotExistError)
      }

      return res.status(200)
        .send({
          statusCode: 200,
          message: 'wallet successfully fetched',
          wallet: walletExists
        })
    })
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({
        message: err.message ? err.message : 'Something something went wrong, could not get user wallet'
      }))
}

module.exports = {
  createVendorWallet,
  getVendorWallet
}
