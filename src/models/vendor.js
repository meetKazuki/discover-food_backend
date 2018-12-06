const mongoose = require('mongoose')

const { Schema } = mongoose

const Vendor = new Schema({
  user: {
    type: Schema.Types.ObjectId, ref: 'User'
  },
  address: {
    type: String
  },
  offline: {
    type: Boolean
  },
  role: {
    type: String
  }
})

module.exports = mongoose.model('Vendor', Vendor)
