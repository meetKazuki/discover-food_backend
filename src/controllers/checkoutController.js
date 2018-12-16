const {
  paymentService,
  getBanks,
  verifyBankAccount,
  verifyTransaction
} = require('../../utils/paymentService')
// {
//   email:"some@body.nice",
//   amount:"10000",
//   metadata:{
//     custom_fields:[
//       {
//         value:"makurdi",
//         display_name: "Donation for",
//         variable_name: "donation_for"
//       }
//     ]
//   },
//   bank:{
//       code:"057",
//       account_number:"0000000000"
//   },
//   birthday:"1995-12-23"
// }

/**
 *
 *
  email:"some@body.nice",
  amount:"10000",
  metadata:{
    custom_fields:[
      {
        value:"makurdi",
        display_name: "Donation for",
        variable_name: "donation_for"
      }
    ]
  },
  card:{
    cvv:"408",
    number:"4084084084084081",
    expiry_month:"01",
    expiry_year:"99"
  }
 */

/**
 * A User should be able to create an order with a bank account
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const createOrder = (req, res) => {
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

  // if (!modifiedInputValues.bankDetails && !modifiedInputValues.cardDetails) {
  //   const mustHaveBankOrCardDetailsError = new Error()
  //   mustHaveBankOrCardDetailsError.message = 'order must have card or bank details'
  //   return res.status(400).send(mustHaveBankOrCardDetailsError)
  // }
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

  // if (modifiedInputValues.cardDetails) {
  //   const cardDetails = ['cardCvv',
  //     'cardNumber',
  //     'cardExpiryMonth',
  //     'cardExpiryYear']

  //   const checkCompleteCardDetails = cardDetails.map((detail) => {
  //     if (!modifiedInputValues.cardDetails[detail]) {
  //       return false
  //     }
  //     return detail
  //   })

  //   if (checkCompleteCardDetails.indexOf(false) > -1) {
  //     const mustProvideCorrectBankDetailsError = new Error()
  //     mustProvideCorrectBankDetailsError.message = 'missing bank detail'
  //     mustProvideCorrectBankDetailsError.statusCode = 400
  //     return res.status(400).send(mustProvideCorrectBankDetailsError)
  //   }

  //   paymentInfo.card = {
  //     cvv: modifiedInputValues.cardDetails.cardCvv,
  //     number: modifiedInputValues.cardDetails.cardNumber,
  //     expiry_month: modifiedInputValues.cardDetails.cardExpiryMonth,
  //     expiry_year: modifiedInputValues.cardDetails.cardExpiryYear
  //   }

  //   delete modifiedInputValues.cardDetails
  // }

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
 * A User should be able to delete meal from cart
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const cancelOrder = (req, res) => {
  const { currentUser } = req
  const { mealId } = req.params

  if (!mealId) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Meal id is missing'
    missingFieldError.statusCode = 400
    return Promise.reject(missingFieldError)
  }

  let meal
  // Verify that user is registered

  // Verify that meal exists
  req.Models.Meal.findOne({
    _id: mealId
  })
    .populate('vendor')
    .exec()
    .then((mealExists) => {
      if (!mealExists) {
        const mealDoesNotExistError = new Error()
        mealDoesNotExistError.message = 'Meal does not exist'
        mealDoesNotExistError.statusCode = 400
        return Promise.reject(mealDoesNotExistError)
      }
      meal = mealExists
      return req.Models.Cart.findOne({
        user: currentUser._id
      })
    })
    .then((userCart) => {
      if (!userCart) {
        const cartDoesNotExistError = new Error()
        cartDoesNotExistError.message = 'cart does not exist'
        cartDoesNotExistError.statusCode = 400
        return Promise.reject(cartDoesNotExistError)
      }

      return req.Models.Cart.findOne({
        _id: userCart._id
      }, {
        new: true
      })
        .select('cartItems')
        .exec()
    })
    .then((cartToUpdate) => {
      const mealIsInCart = cartToUpdate.cartItems.indexOf(meal._id)
      cartToUpdate.cartItems = cartToUpdate.cartItems
        .filter(item => item.toString() !== meal._id.toString())
      if (mealIsInCart > -1) {
        return req.Models.Cart.findOneAndUpdate({
          _id: cartToUpdate._id
        },
        {
          cartItems: cartToUpdate.cartItems
        },
        {
          new: true
        })
      }

      const mealNotInCart = new Error()
      mealNotInCart.message = 'Meal is not in cart'
      mealNotInCart.statusCode = 400
      return Promise.reject(mealNotInCart)
    })
    .then(deletedCartMeal => res.status(201).send({
      message: 'Cart successfully deleted meal from cart',
      data: [deletedCartMeal]
    }))
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({ message: err.message ? err.message : 'Something something went wrong, could not to cart' }))
}

/**
 * A User should be able to add meal to cart
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const addMealToCart = (req, res) => {
  const { currentUser } = req
  const { mealId } = req.params

  if (!mealId) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Meal id is missing'
    missingFieldError.statusCode = 400
    return Promise.reject(missingFieldError)
  }

  let meal
  // Verify that user is registered

  // Verify that meal exists
  return req.Models.Meal.findOne({
    _id: mealId
  })
    .populate('vendor')
    .exec()
    .then((mealExists) => {
      if (!mealExists) {
        const mealDoesNotExistError = new Error()
        mealDoesNotExistError.message = 'Meal does not exist'
        mealDoesNotExistError.statusCode = 400
        return Promise.reject(mealDoesNotExistError)
      }
      meal = mealExists
      return req.Models.Cart.findOne({
        user: currentUser._id
      })
    })
    .then((userCart) => {
      if (!userCart) {
        const cartDoesNotExistError = new Error()
        cartDoesNotExistError.message = 'cart does not exist'
        cartDoesNotExistError.statusCode = 400
        return Promise.reject(cartDoesNotExistError)
      }

      return req.Models.Cart.findOne({
        _id: userCart._id
      }, {
        new: true
      })
        .select('cartItems')
        .exec()
    })
    .then((cartToUpdate) => {
      const mealIsInCart = cartToUpdate.cartItems.indexOf(meal._id)
      if (mealIsInCart < 0) {
        return req.Models.Cart.findOneAndUpdate({
          _id: cartToUpdate._id
        },
        {
          cartItems: cartToUpdate.cartItems.concat([meal._id])
        },
        {
          new: true
        })
      }

      const mealNotInCart = new Error()
      mealNotInCart.message = 'Meal is already in cart'
      mealNotInCart.statusCode = 400
      return Promise.reject(mealNotInCart)
    })
    .then(addedCartItem => res.status(201).send({
      message: 'Cart successfully added',
      data: [addedCartItem]
    }))
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({ message: err.message ? err.message : 'Something something went wrong, could not to cart' }))
}

/**
 * A User should be to view meal items in a cart
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const viewCartItems = (req, res) => {
  const { currentUser } = req

  // Verify that meal exists
  return req.Models.Cart.findOne({
    user: currentUser._id
  })
    .populate('user')
    .populate('cartItems')
    .exec()
    .then((userCart) => {
      if (!userCart) {
        const cartDoesNotExistError = new Error()
        cartDoesNotExistError.message = 'cart does not exist'
        cartDoesNotExistError.statusCode = 400
        return Promise.reject(cartDoesNotExistError)
      }

      return res.status(200).send({
        message: 'User get cart details successful',
        data: [userCart]
      })
    })
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({ message: err.message ? err.message : 'Something something went wrong, could not to cart' }))
}

module.exports = {
  createOrder,
  cancelOrder,
  viewCartItems,
  addMealToCart
}
