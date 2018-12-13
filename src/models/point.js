
const mongoose = require('mongoose')

const { Schema } = mongoose
const Point = new Schema({
  user: {
    type: Schema.Types.ObjectId, ref: 'User'
  },
  type: {
    type: String,
    enum: ['Point']
  },
  coordinates: {
    type: [Number]
  }
})

module.exports = mongoose.model('Points', Point)
