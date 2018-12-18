const mongoose = require('mongoose')

// const User = require('./user')

const { Schema } = mongoose

const Vendor = new Schema({
  user: {
    type: Schema.Types.ObjectId, ref: 'User'
  },
  location: {
    type: Schema.Types.ObjectId, ref: 'Point'
  },
  offline: {
    type: Boolean
  },
  role: {
    type: String
  }
})

module.exports = mongoose.model('Vendor', Vendor)
