const {
  register
} = require('./user')

// All your parent route link should be in this file
// Create your route file in the routes folder and link your file here
/**
 * e.g const userRoute = require('./userRoute');
 *     router.use("/user", userRoute)
 */

const router = (app) => {
  app.post('/api/v1/register', register)
}

module.exports = router
