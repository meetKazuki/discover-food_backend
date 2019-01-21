const mongoose = require('mongoose')

const { Schema } = mongoose

const Transaction = new Schema({
  user: {
    type: Schema.Types.ObjectId, ref: 'User'
  },
  wallet: {
    type: Schema.Types.ObjectId, ref: 'Wallet'
  },
  amount: {
    type: Number
  },
  reference: {
    type: String
  },
  operation: {
    type: String
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Transaction', Transaction)
