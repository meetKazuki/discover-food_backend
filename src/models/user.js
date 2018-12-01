const mongoose = require('mongoose')
const { hash } = require('../../utils/hash')

const {
  isAlphaNumeric,
  isEmail,
  isLength,
  passwordLength,
  isMobilePhone,
  hasNumber,
  hasSpecialCharater
} = require('../../utils/validator')

const { Schema } = mongoose

const User = new Schema({
  firstName: {
    type: String,
    validate: [{
      validator: isAlphaNumeric,
      msg: 'first name must be alphanumeric'
    }, {
      validator: isLength,
      msg: 'first name must have 4-255 characters'
    }]
  },
  lastName: {
    type: String,
    validate: [{
      validator: isAlphaNumeric,
      msg: 'last name must be alphanumeric'
    }, {
      validator: isLength,
      msg: 'last name must have 4-255 characters'
    }]
  },
  password: {
    type: String,
    unique: true
  },
  email: {
    type: String,
    unique: true,
    validate: [
      isEmail,
      'must be a valid Email'
    ]
  },
  phone: {
    type: String,
    unique: true,
    validate: [
      isMobilePhone,
      'must be a valid mobile phone number'
    ]
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Number
  }
})

User.pre('validate', function (next) {
  const user = this
  if (!passwordLength(user.password)) {
    return next({ message: 'password must have 6-255 characters' })
  }
  if (!hasNumber(user.password)) {
    return next({ message: 'password must contain at least a number' })
  }
  if (!hasSpecialCharater(user.password)) {
    return next({ message: 'password must contain at least a special character' })
  }
  next()
})

// hash password before saving to database
User.pre('save', function (next) {
  const user = this
  user.password = hash(user.password)
  next()
})

module.exports = mongoose.model('User', User)
