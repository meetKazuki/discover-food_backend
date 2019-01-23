const mongoose = require('mongoose')
const {
  createRefund,
  createCharge,
  initializeTransaction
} = require('../../utils/paymentService')

const {
  pushNotificationService
} = require('../../utils/pushNotificationService')

const {
  getDurationBetweenLocations
} = require('../../utils/googleDistanceMatrixService')

/**
 * A User should be able to create an order with a bank account
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const checkout = (req, res) => {
  const { currentUser } = req
  const { cartId, vendorId } = req.params
  const inputVals = [
    'shippingAddress',
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

  if (!cartId && !inputVals.length && !vendorId) {
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

  if (!modifiedInputValues.shippingAddress) {
    const mustHaveShippingAddressError = new Error()
    mustHaveShippingAddressError.message = 'order must have a shipping address'
    mustHaveShippingAddressError.statusCode = 400
    return res.status(400).send(mustHaveShippingAddressError)
  }

  let cart
  let timeToArrival
  let transactionInfo
  let vendorIds
  let vendorExists

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
  modifiedInputValues.email = currentUser.email

  req.Models.User.findOne({
    _id: vendorId
  })
    .then((vendor) => {
      if (!vendor.role.includes('vendor')) {
        const userNotAVendorError = new Error()
        userNotAVendorError.message = 'user is not a vendor'
        userNotAVendorError.statusCode = 400
        return Promise.reject(userNotAVendorError)
      }

      vendorExists = vendor

      return req.Models.Cart.findOne({
        user: currentUser._id
      })
        .populate('cartItems')
        .exec()
    })
    .then((cartExists) => {
      if (!cartExists) {
        const orderDoesNotExistError = new Error()
        orderDoesNotExistError.message = 'Cart does not exist'
        orderDoesNotExistError.statusCode = 400
        return Promise.reject(orderDoesNotExistError)
      }
      cart = cartExists
      // paymentInfo.amount = orderExists.cartItems
      //   .reduce((currentPrice, cartItem) => currentPrice + cartItem.pricePerOrderSize, 0) * 100

      vendorIds = cartExists.cartItems.map(item => mongoose.Types.ObjectId(item.vendor))

      return initializeTransaction({
        email: currentUser.email,
        amount: modifiedInputValues.amount,
        subaccount: vendorExists.subaccount
      })
    })
    .then(() => createCharge(modifiedInputValues))
    .then((chargeTransaction) => {
      if (chargeTransaction.data.status !== 'success') {
        const chargeTransactionFailedError = new Error()
        chargeTransactionFailedError.message = 'this charge transaction was not a success'
        chargeTransactionFailedError.statusCode = 400
        return Promise.reject(chargeTransactionFailedError)
      }
      transactionInfo = chargeTransaction
      return req.Models.User.find({
        _id: { $in: vendorIds }
      })
    })
    .then((vendors) => {
      const mealLocation = vendors
        .map(vendor => vendor.location.coordinates.join(','))
      return getDurationBetweenLocations(mealLocation, [modifiedInputValues.shippingAddress])
    })
    .then((duration) => {
      timeToArrival = duration
      return pushNotificationService('Checkout was successful')
    })
    .then(() => req.Models.Cart.findOneAndDelete({
      user: currentUser._id
    }))
    .then((deletedCart) => {
      if (!deletedCart) {
        const cartNotDeletedError = new Error()
        cartNotDeletedError.message = 'cart for this successful order could not be deleted'
        cartNotDeletedError.statusCode = 400
        return Promise.reject(cartNotDeletedError)
      }

      return req.Models.Order.create({
        dateCreated: Date.now(),
        customer: currentUser._id,
        cart: deletedCart._id,
        shippingAddress: modifiedInputValues.shippingAddress,
        paymentId: transactionInfo.data.id,
        referenceId: transactionInfo.data.reference,
        amount: transactionInfo.data.amount
      })
    })
    .then((orderCreated) => {
      if (!orderCreated) {
        const orderNotCreatedError = new Error()
        orderNotCreatedError.message = 'order could not be created'
        orderNotCreatedError.statusCode = 400
        return Promise.reject(orderNotCreatedError)
      }

      return res.status(201).send({
        statusCode: 201,
        message: 'order successfully created',
        data: {
          order: orderCreated,
          timeToArrival
        }
      })
    })
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({
        message: err.message ? err.message : 'Something something went wrong, could not create order'
      }))
}

/**
 * A User should be able to cancel an order created
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const cancelOrder = (req, res) => {
  const { currentUser } = req
  const { orderId } = req.params

  if (!orderId) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing order id'
    return res.status(400).send(missingFieldError)
  }

  let order

  return req.Models.Order.findOne({
    customer: currentUser._id,
    _id: orderId
  })
    .then((orderExists) => {
      if (!orderExists) {
        const orderDoesNotExistError = new Error()
        orderDoesNotExistError.message = 'Order does not exist'
        orderDoesNotExistError.statusCode = 400
        return Promise.reject(orderDoesNotExistError)
      }
      order = orderExists

      return createRefund(orderExists.referenceId)
    })
    .then(() => req.Models.Order.findOneAndDelete({
      _id: order._id
    })
      .then(() => res.status(200).send({
        statusCode: 200,
        message: 'Order successfull canceled'
      })))
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({ message: err.message ? err.message : 'Something something went wrong, could not cancel order' }))
}

/**
 * Fetch a users orders
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const getUserOrders = (req, res) => {
  const { currentUser } = req

  // Verify that meal exists
  return req.Models.Order.find({
    customer: currentUser._id
  })
    .populate('customer', '-password')
    .exec()
    .then((userOrder) => {
      if (!userOrder) {
        const orderDoesNotExistError = new Error()
        orderDoesNotExistError.message = 'user does not not have an order'
        orderDoesNotExistError.statusCode = 400
        return Promise.reject(orderDoesNotExistError)
      }

      return res.status(200).send({
        statusCode: 200,
        message: 'get user orders successful',
        data: {
          orders: userOrder
        }
      })
    })
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({ message: err.message ? err.message : 'Something something went wrong, could not get user orders' }))
}

module.exports = {
  checkout,
  cancelOrder,
  getUserOrders
}
