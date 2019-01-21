const mongoose = require('mongoose')

const { Schema } = mongoose

const Wallet = new Schema({
  user: {
    type: Schema.Types.ObjectId, ref: 'User'
  },
  amount: {
    type: Number
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Wallet', Wallet)
