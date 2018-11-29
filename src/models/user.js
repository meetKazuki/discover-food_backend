const mongoose = require('mongoose')

const {
  isAlphaNumeric,
  isEmail,
  isLength,
  passwordLength,
  isMobilePhone
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
    unique: true,
    validate: [
      passwordLength,
      'password must have 6-255 characters'
    ]
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

module.exports = mongoose.model('User', User)
