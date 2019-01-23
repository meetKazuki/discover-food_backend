const mongoose = require('mongoose')

const { Schema } = mongoose

const VendorWallet = new Schema({
  user: {
    type: Schema.Types.ObjectId, ref: 'User'
  },
  amount: {
    type: Number
  },
  subAccountCode: {
    type: String
  },
  accountInfo: {
    businessName: {
      type: String
    },
    settlementBank: {
      type: String
    },
    accountNumber: {
      type: String
    }
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('VendorWallet', VendorWallet)
