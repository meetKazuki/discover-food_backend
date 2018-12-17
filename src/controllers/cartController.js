const {
  hasEmptyField
} = require('../../utils/validator')

/**
 * A User should be able to create a cart
 * @param {Object} req request object
 * @param {Object} res response object
 *
 * @return {Object} res response object
 */
const createCart = (req, res) => {
  const { currentUser } = req
  const { mealId } = req.params

  const fieldIsEmpty = hasEmptyField([
    'orderType', 'foodType'], req.body)

  if (!mealId && fieldIsEmpty) {
    const missingFieldError = new Error()
    missingFieldError.message = 'Meal id is missing'
    missingFieldError.statusCode = 400
    return Promise.reject(missingFieldError)
  }

  let meal
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
      const Cart = new req.Models.Cart()
      if (!userCart) {
        return Cart.createCart(meal, currentUser, req.body.orderType, req.body.foodSize)
          .then(createdCart => res.status(201).send({
            statusCode: 201,
            message: 'Cart successfully created',
            data: [createdCart]
          }))
      }

      const cartAlreadyExistsError = new Error()
      cartAlreadyExistsError.message = 'cart already exists cannot be created'
      cartAlreadyExistsError.statusCode = 400
      return Promise.reject(cartAlreadyExistsError)
    })
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
const deleteMealInCart = (req, res) => {
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
      statusCode: 201,
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
  let cart
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
      cart = userCart
      return req.Models.Cart.findOne({
        _id: userCart._id
      }, {
        new: true
      })
        .select('cartItems')
        .exec()
    })
    .then((cartToUpdate) => {
      // I am in cart
      const mealIsInCart = cartToUpdate.cartItems.indexOf(meal._id)
      const totalPrice = cart.totalPrice + meal.unitPriceAmount
      if (mealIsInCart < 0) {
        return req.Models.Cart.findOneAndUpdate({
          _id: cartToUpdate._id
        },
        {
          cartItems: cartToUpdate.cartItems.concat([meal._id]),
          totalPrice
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
      statusCode: 201,
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
        statusCode: 200,
        message: 'User get cart details successful',
        data: [userCart]
      })
    })
    .catch(err => res.status(err.statusCode ? err.statusCode : 500)
      .send({ message: err.message ? err.message : 'Something something went wrong, could not to cart' }))
}

module.exports = {
  createCart,
  deleteMealInCart,
  viewCartItems,
  addMealToCart
}
