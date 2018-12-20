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
    type: Schema.Types.ObjectId, ref: 'MealImage'
  }],
  quantity: {
    type: Number
  },
  timeToPrepare: {
    type: Number
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
