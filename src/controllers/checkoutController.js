const mongoose = require('mongoose')
const {
  verifyTransaction,
  createRefund
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
  const { cartId } = req.params
  const inputVals = [
    'shippingAddress',
    'transactionReferenceId'
  ].filter(fieldInput => req.body[fieldInput])
    .map(value => ({
      [value]: req.body[value]
    }))

  if (!cartId && !inputVals.length) {
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

  if (!modifiedInputValues.transactionReferenceId) {
    const mustHaveTransactionRefIdError = new Error()
    mustHaveTransactionRefIdError.message = 'order must have a transaction reference id'
    mustHaveTransactionRefIdError.statusCode = 400
    return res.status(400).send(mustHaveTransactionRefIdError)
  }

  let cart
  let timeToArrival
  let transactionInfo

  req.Models.Cart.findOne({
    user: currentUser._id
  })
    .populate('cartItems')
    .exec()
    .then((cartExists) => {
      if (!cartExists) {
        const cartDoesNotExistError = new Error()
        cartDoesNotExistError.message = 'Cart does not exist'
        cartDoesNotExistError.statusCode = 400
        return Promise.reject(cartDoesNotExistError)
      }
      cart = cartExists
      // paymentInfo.amount = orderExists.cartItems
      //   .reduce((currentPrice, cartItem) => currentPrice + cartItem.pricePerOrderSize, 0) * 100

      const vendorIds = cartExists.cartItems.map(item => mongoose.Types.ObjectId(item.vendor))

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
      return verifyTransaction(modifiedInputValues.transactionReferenceId)
    })
    .then((verifiedTransaction) => {
      if (verifiedTransaction.data.status === 'failed') {
        const transactionFailedError = new Error()
        transactionFailedError.message = 'this transaction was a failure'
        transactionFailedError.statusCode = 400
        return Promise.reject(transactionFailedError)
      }

      if (verifiedTransaction.data.status === 'abandoned') {
        const transactionAbandonedError = new Error()
        transactionAbandonedError.message = 'this transaction was abandoned'
        transactionAbandonedError.statusCode = 400
        return Promise.reject(transactionAbandonedError)
      }

      if (
        verifiedTransaction.data.status === 'success'
        || verifiedTransaction.data.status === 'ongoing'
      ) {
        transactionInfo = verifiedTransaction
        return pushNotificationService('Checkout was successful')
      }
    })
    .then(() => req.Models.Order.create({
      dateCreated: Date.now(),
      customer: currentUser._id,
      cart: cart._id,
      shippingAddress: modifiedInputValues.shippingAddress,
      paymentId: transactionInfo.data.id,
      referenceId: transactionInfo.data.reference,
      amount: transactionInfo.data.amount
    }))
    .then(orderCreated => res.status(201).send({
      statusCode: 201,
      message: 'order successfully created',
      data: {
        order: orderCreated,
        timeToArrival
      }
    }))
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

  const inputVals = [
    'transactionReferenceId'
  ].filter(fieldInput => req.body[fieldInput])
    .map(value => ({
      [value]: req.body[value]
    }))

  if (!orderId) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Missing order id'
    return res.status(400).send(missingFieldError)
  }

  const reducer = (accumulator, currentValue) => {
    const [key] = Object.keys(currentValue)
    accumulator[key] = currentValue[key]
    return accumulator
  }
  const modifiedInputValues = inputVals.reduce(reducer, {})

  if (!modifiedInputValues.transactionReferenceId) {
    const mustHaveTransactionRefIdError = new Error()
    mustHaveTransactionRefIdError.message = 'order must have a transaction reference id'
    mustHaveTransactionRefIdError.statusCode = 400
    return res.status(400).send(mustHaveTransactionRefIdError)
  }

  let order

  return req.Models.Order.findOne({
    _id: orderId,
    referenceId: modifiedInputValues.transactionReferenceId
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
    .then(() => req.Models.findOneAndDelete({
      _id: order._id
    }, { new: true })
      .then(() => res.status(200).send({
        statusCode: 200,
        message: 'Order successfull canceled'
      })))
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({ message: err.message ? err.message : 'Something something went wrong, could not cancel order' }))
}

module.exports = {
  checkout,
  cancelOrder
}
