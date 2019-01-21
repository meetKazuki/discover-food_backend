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

const Admin = new Schema({
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
    type: String
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
  },
  role: [{
    type: String
  }],
  image: {
    type: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  }
}, {
  timestamps: true
})

Admin.pre('validate', function (next) {
  const admin = this
  if (!passwordLength(admin.password)) {
    return next({ message: 'password must have 6-255 characters' })
  }
  if (!hasNumber(admin.password)) {
    return next({ message: 'password must contain at least a number' })
  }
  if (!hasSpecialCharater(admin.password)) {
    return next({ message: 'password must contain at least a special character' })
  }
  next()
})

// hash password before saving to database
Admin.pre('save', function (next) {
  const admin = this
  admin.password = hash(admin.password)
  next()
})

Admin.set('toObject', {
  transform: (doc, ret) => {
    delete ret.password
  }
})

module.exports = mongoose.model('Admin', Admin)
