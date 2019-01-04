const mongoose = require('mongoose')

const { Schema } = mongoose

const Meal = new Schema({
  vendor: {
    type: Schema.Types.ObjectId, ref: 'User'
  },
  name: {
    type: String
  },
  description: {
    type: String
  },
  unitPriceType: {
    type: String
  },
  unitPriceAmount: {
    type: Number
  },
  mealImages: [{
    type: String
  }],
  quantity: {
    type: Number
  },
  timeToPrepare: {
    type: Number
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
})

Meal.index({
  name: 'text'
})

// Vendor.statics.findByLocation = (coordinates) => {
//   const query = this.findOne
//   return new Promise((resolve, reject) => {
//     User.findOne({
//       location: {
//         $near: coordinates || [],
//         maxDist: 1000
//       }
//     })
//   })
// }

// Meal.statics.addLocation = (vendorId) => {
//   return new Promise((resolve, reject) => {
//     if (vendorId === this.vendor) {
//       Vendor.findById(vendorId)
//         .populate('location')
//         .exec()
//         .then((vendor) => {
//           this.location.coordinates = vendor.location.coordinates
//           this.save()
//           return resolve(true)
//         })
//     }
//     return reject(new Error(false))
//   })
// }

module.exports = mongoose.model('Meal', Meal)
