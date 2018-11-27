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
    required: true,
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
    required: true,
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
    required: true,
    unique: true,
    validate: [
      passwordLength,
      'password must have 6-255 characters'
    ]
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [
      isEmail,
      'must be a valid Email'
    ]
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    validate: [
      isMobilePhone,
      'must be a valid mobile phone number'
    ]
  }
})

module.exports = mongoose.model('User', User)
