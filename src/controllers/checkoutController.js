const {
  paymentService,
  getBanks,
  verifyBankAccount,
  verifyTransaction,
  verifyCardBin
} = require('../../utils/paymentService')

/**
 * A User should be able to create an order with a bank account
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const checkoutWithBankAccount = (req, res) => {
  const { currentUser } = req
  const { cartId } = req.params
  const inputVals = [
    'shippingAddress',
    'bankName',
    'birthday',
    'bankAccountNumber'
  ].filter(fieldInput => req.body[fieldInput])
    .map(value => ({
      [value]: req.body[value]
    }))

  if (!cartId && !inputVals.length) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Field is missing'
    return res.status(400).send(missingFieldError)
  }

  const reducer = (accumulator, currentValue) => {
    const [key] = Object.keys(currentValue)
    accumulator[key] = currentValue[key]
    return accumulator
  }
  const modifiedInputValues = inputVals.reduce(reducer, {})

  if (!modifiedInputValues.shippingAddress) {
    const mustHaveShippingAddressError = new Error()
    mustHaveShippingAddressError.message = 'order must have a shipping address'
    return res.status(400).send(mustHaveShippingAddressError)
  }

  let cart
  let paymentInfo

  if (
    !modifiedInputValues.bankName
    || !modifiedInputValues.birthday
    || !modifiedInputValues.bankAccountNumber) {
    const mustProvideCorrectBankDetailsError = new Error()
    mustProvideCorrectBankDetailsError.message = 'missing bank detail'
    return res.status(400).send(mustProvideCorrectBankDetailsError)
  }

  return getBanks()
    .then((banks) => {
      const bankData = banks.data.filter(bank => bank.name === modifiedInputValues.bankName)
      if (!bankData.length) {
        const bankNotSupportedError = new Error()
        bankNotSupportedError.message = 'This bank is currently not supported'
        bankNotSupportedError.statusCode = 400
        return Promise.reject(bankNotSupportedError)
      }
      paymentInfo = {
        bank: {
          code: bankData[0].code,
          account_number: modifiedInputValues.bankAccountNumber,
        },
        birthday: modifiedInputValues.birthday,
        email: currentUser.email
      }

      return verifyBankAccount(paymentInfo.bank.account_number, paymentInfo.bank.code)
    })
    .then((validBankAccount) => {
      if (
        !validBankAccount.data.account_number
        && !validBankAccount.data.account_name) {
        const accountNotValidError = new Error()
        accountNotValidError.message = 'This is not a valid account'
        accountNotValidError.statusCode = 400
        return Promise.reject(accountNotValidError)
      }
      return req.Models.Cart.findOne({
        user: currentUser._id
      })
        .populate('cartItems')
        .exec()
    })
    .then((cartExists) => {
      if (!cartExists) {
        const cartDoesNotExistError = new Error()
        cartDoesNotExistError.message = 'Cart does not exist'
        cartDoesNotExistError.statusCode = 400
        return Promise.reject(cartDoesNotExistError)
      }
      cart = cartExists
      paymentInfo.amount = cartExists.cartItems
        .reduce((currentPrice, cartItem) => currentPrice + cartItem.unitPriceAmount, 0)

      return paymentService(paymentInfo)
    })
    .then((charge) => {
      if (!charge.data && !charge.data.reference) {
        const chargeError = new Error()
        chargeError.message = 'Something went wrong, no charge created'
        chargeError.statusCode = 500
        return Promise.reject(chargeError)
      }
      return verifyTransaction(charge.data.reference)
    })
    .then((verifiedTransaction) => {
      if (verifiedTransaction.data.status === 'failed') {
        const transactionFailedError = new Error()
        transactionFailedError.message = 'this transaction was not a success'
        transactionFailedError.statusCode = 400
        return Promise.reject(transactionFailedError)
      }

      if (
        verifiedTransaction.data.status === 'success'
        || verifiedTransaction.data.status === 'ongoing'
      ) {
        return req.Models.Order.create({
          dateCreated: Date.now(),
          customer: currentUser._id,
          cart: cart._id,
          shippingAddress: modifiedInputValues.shippingAddress,
          paymentId: verifiedTransaction.data.id
        })
      }
    })
    .then(orderCreated => res.status(201).send(orderCreated))
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({ message: err.message ? err.message : 'Something something went wrong, could not to cart' }))
}

/**
 * A User should be able to create an order with a bank account
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const checkoutWithCard = (req, res) => {
  const { currentUser } = req
  const { cartId } = req.params
  const inputVals = [
    'shippingAddress',
    'cardCvv',
    'cardNumber',
    'cardExpiryMonth',
    'cardExpiryYear'
  ].filter(fieldInput => req.body[fieldInput])
    .map(value => ({
      [value]: req.body[value]
    }))

  if (!cartId && !inputVals.length) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Field is missing'
    return res.status(400).send(missingFieldError)
  }

  const reducer = (accumulator, currentValue) => {
    const [key] = Object.keys(currentValue)
    accumulator[key] = currentValue[key]
    return accumulator
  }
  const modifiedInputValues = inputVals.reduce(reducer, {})

  if (!modifiedInputValues.shippingAddress) {
    const mustHaveShippingAddressError = new Error()
    mustHaveShippingAddressError.message = 'order must have a shipping address'
    return res.status(400).send(mustHaveShippingAddressError)
  }

  let cart
  let paymentInfo

  if (
    !modifiedInputValues.cardCvv
    || !modifiedInputValues.cardNumber
    || !modifiedInputValues.cardExpiryMonth
    || !modifiedInputValues.cardExpiryYear) {
    const mustProvideCorrectCardDetailsError = new Error()
    mustProvideCorrectCardDetailsError.message = 'missing card detail'
    return res.status(400).send(mustProvideCorrectCardDetailsError)
  }

  return verifyCardBin(modifiedInputValues.cardNumber.slice(0, 6))
    .then((validCard) => {
      if (!validCard.data && !validCard.data.bin) {
        const cardNotValidError = new Error()
        cardNotValidError.message = 'This card is not valid'
        cardNotValidError.statusCode = 400
        return Promise.reject(cardNotValidError)
      }
      paymentInfo = {
        card: {
          cvv: modifiedInputValues.cardCvv,
          number: modifiedInputValues.cardNumber,
          expiry_month: modifiedInputValues.cardExpiryMonth,
          expiry_year: modifiedInputValues.cardExpiryYear
        },
        email: currentUser.email
      }

      return req.Models.Cart.findOne({
        user: currentUser._id
      })
        .populate('cartItems')
        .exec()
    })
    .then((cartExists) => {
      if (!cartExists) {
        const cartDoesNotExistError = new Error()
        cartDoesNotExistError.message = 'Cart does not exist'
        cartDoesNotExistError.statusCode = 400
        return Promise.reject(cartDoesNotExistError)
      }
      cart = cartExists
      paymentInfo.amount = cartExists.cartItems
        .reduce((currentPrice, cartItem) => currentPrice + cartItem.unitPriceAmount, 0)

      return paymentService(paymentInfo)
    })
    .then((charge) => {
      if (!charge.data && !charge.data.reference) {
        const chargeError = new Error()
        chargeError.message = 'Something went wrong, no charge created'
        chargeError.statusCode = 500
        return Promise.reject(chargeError)
      }
      return verifyTransaction(charge.data.reference)
    })
    .then((verifiedTransaction) => {
      if (verifiedTransaction.data.status === 'failed') {
        const transactionFailedError = new Error()
        transactionFailedError.message = 'this transaction was not a success'
        transactionFailedError.statusCode = 400
        return Promise.reject(transactionFailedError)
      }

      if (
        verifiedTransaction.data.status === 'success'
        || verifiedTransaction.data.status === 'ongoing'
      ) {
        return req.Models.Order.create({
          dateCreated: Date.now(),
          customer: currentUser._id,
          cart: cart._id,
          shippingAddress: modifiedInputValues.shippingAddress,
          paymentId: verifiedTransaction.data.id
        })
      }
    })
    .then(orderCreated => res.status(201).send(orderCreated))
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({ message: err.message ? err.message : 'Something something went wrong, could not to cart' }))
}


module.exports = {
  checkoutWithBankAccount,
  checkoutWithCard
}
