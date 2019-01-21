const {
  createCharge
} = require('../../utils/paymentService')

const {
  TRANSFER,
  WITHDRAWAL,
  DEPOSIT
} = require('../../utils/constant')

/**
 * Fund a users wallet
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const fundWallet = (req, res) => {
  const { currentUser } = req
  const inputVals = [
    'cardCvv',
    'cardNumber',
    'expiryMonth',
    'expiryYear',
    'pin',
    'amount'
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

  let wallet
  let transactionInfo
  const card = {}
  card.cvv = modifiedInputValues.cardCvv
  delete modifiedInputValues.cardCvv
  card.number = modifiedInputValues.cardNumber
  delete modifiedInputValues.cardNumber
  card.expiry_month = modifiedInputValues.expiryMonth
  delete modifiedInputValues.expiryMonth
  card.expiry_year = modifiedInputValues.expiryYear
  delete modifiedInputValues.expiryYear

  modifiedInputValues.card = card

  createCharge(modifiedInputValues)
    .then((chargeTransaction) => {
      if (chargeTransaction.data.status !== 'success') {
        const chargeTransactionFailedError = new Error()
        chargeTransactionFailedError.message = 'this charge transaction was not a success'
        chargeTransactionFailedError.statusCode = 400
        return Promise.reject(chargeTransactionFailedError)
      }
      transactionInfo = chargeTransaction
      return req.Models.Wallet.findOne({
        user: currentUser._id
      })
    })
    .then((walletExists) => {
      if (!walletExists) {
        return req.Models.Wallet.create({
          amount: modifiedInputValues.amount,
          user: currentUser._id
        })
      }

      const walletAlreadyExistsError = new Error()
      walletAlreadyExistsError.message = 'wallet already exists error'
      walletAlreadyExistsError.statusCode = 400
      return Promise.reject(walletAlreadyExistsError)
    })
    .then((walletUpdates) => {
      if (!walletUpdates) {
        const walletDepositError = new Error()
        walletDepositError.message = 'could not make deposit in wallet'
        walletDepositError.statusCode = 400
        return Promise.reject(walletDepositError)
      }
      wallet = walletUpdates
      return req.Models.Transaction.create({
        user: currentUser._id,
        wallet: walletUpdates._id,
        amount: transactionInfo.data.amount,
        reference: transactionInfo.data.reference,
        operation: DEPOSIT
      })
    })
    .then((transaction) => {
      if (!transaction) {
        const transactionError = new Error()
        transactionError.message = 'could not create transaction'
        transactionError.statusCode = 400
        return Promise.reject(transactionError)
      }

      return res.status(201)
        .send({
          statusCode: 201,
          message: 'wallet successfully funded',
          data: {
            wallet,
            transaction
          }
        })
    })
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({
        message: err.message ? err.message : 'Something something went wrong, could not create order'
      }))
}


/**
 * Make deposit in users wallet
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const walletDeposit = (req, res) => {
  const { currentUser } = req
  const inputVals = [
    'cardCvv',
    'cardNumber',
    'expiryMonth',
    'expiryYear',
    'pin',
    'amount'
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

  let wallet
  let transactionInfo
  const card = {}
  card.cvv = modifiedInputValues.cardCvv
  delete modifiedInputValues.cardCvv
  card.number = modifiedInputValues.cardNumber
  delete modifiedInputValues.cardNumber
  card.expiry_month = modifiedInputValues.expiryMonth
  delete modifiedInputValues.expiryMonth
  card.expiry_year = modifiedInputValues.expiryYear
  delete modifiedInputValues.expiryYear

  modifiedInputValues.card = card

  createCharge(modifiedInputValues)
    .then((chargeTransaction) => {
      if (chargeTransaction.data.status !== 'success') {
        const chargeTransactionFailedError = new Error()
        chargeTransactionFailedError.message = 'this charge transaction was not a success'
        chargeTransactionFailedError.statusCode = 400
        return Promise.reject(chargeTransactionFailedError)
      }
      transactionInfo = chargeTransaction
      return req.Models.Wallet.findOne({
        user: currentUser._id
      })
    })
    .then((walletExists) => {
      if (!walletExists) {
        const walletDoesNotExistError = new Error()
        walletDoesNotExistError.message = 'wallet does not exist'
        walletDoesNotExistError.statusCode = 400
        return Promise.reject(walletDoesNotExistError)
      }

      const amount = walletExists.amount + transactionInfo.data.amount
      return req.Models.Wallet.findOneAndUpdate({
        user: currentUser._id
      }, { amount }, { new: true })
    })
    .then((walletUpdates) => {
      if (!walletUpdates) {
        const walletDepositError = new Error()
        walletDepositError.message = 'could not make deposit in wallet'
        walletDepositError.statusCode = 400
        return Promise.reject(walletDepositError)
      }
      wallet = walletUpdates
      return req.Models.Transaction.create({
        user: currentUser._id,
        wallet: walletUpdates._id,
        amount: transactionInfo.data.amount,
        reference: transactionInfo.data.reference,
        operation: DEPOSIT
      })
    })
    .then((transaction) => {
      if (!transaction) {
        const transactionError = new Error()
        transactionError.message = 'could not create transaction'
        transactionError.statusCode = 400
        return Promise.reject(transactionError)
      }

      return res.status(200)
        .send({
          statusCode: 200,
          message: 'wallet successfully funded',
          data: {
            wallet,
            transaction
          }
        })
    })
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({
        message: err.message ? err.message : 'Something something went wrong, could not make wallet deposit'
      }))
}

/**
 * Get a user wallet
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const getUserWallet = (req, res) => {
  const { currentUser } = req
  req.Models.Wallet.findOne({
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

/**
 * Get a user transaction
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const getUserTransactions = (req, res) => {
  const { currentUser } = req
  req.Models.Transaction.find({
    user: currentUser._id
  })
    .populate('user', '-password')
    .exec()
    .then((transactionExists) => {
      if (!transactionExists) {
        const transactionDoesNotExistError = new Error()
        transactionDoesNotExistError.message = 'wallet does not exist'
        transactionDoesNotExistError.statusCode = 400

        return Promise.reject(transactionDoesNotExistError)
      }

      return res.status(200)
        .send({
          statusCode: 200,
          message: 'transaction successfully fetched',
          transactions: transactionExists
        })
    })
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({
        message: err.message ? err.message : 'Something something went wrong, could not make wallet deposit'
      }))
}

module.exports = {
  fundWallet,
  walletDeposit,
  getUserWallet,
  getUserTransactions
}
