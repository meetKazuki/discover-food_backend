const validator = require('validator')

/**
 * Check if string is alpha numeric
 * @param {String} str string to check if alpha numeric
 * @return {Boolean} true if alpha numeric else false
 */
exports.isAlphaNumeric = str => validator.isAlphanumeric(str)

/**
 * Check if string is an email
 * @param {String} str string to check if an email
 * @return {Boolean} true if an email else false
 */
exports.isEmail = str => validator.isEmail(str)

/**
 * Check if string is within a length range
 * @param {String} str string to check if it meets required length
 * @return {Boolean} true if within range else false
 */
exports.isLength = str => validator.isLength(str, {
  min: 1,
  max: 255
})

/**
 * Check if string has special characters
 * @param {String} str string to check if it contains a special char
 * @return {Boolean} true if it contains a special character else false
 */
exports.hasSpecialCharater = (str) => {
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"|,.<>/?]/
  if (hasSpecialChar.test(str)) return true
  return false
}

/**
 * Check if a string has a number
 * @param {String} str string to check if it contains a number
 * @return {Boolean} true if it contains a number else false
 */
exports.hasNumber = (str) => {
  const hasNumber = /\d/
  if (hasNumber.test(str)) return true
  return false
}

/**
 * Check if string is within a length range
 * @param {String} str string to check if it meets required length
 * @return {Boolean} true if within range else false
 */
exports.passwordLength = str => validator.isLength(str, {
  min: 6,
  max: 255
})

/**
 * Check if string is a mobile phone number
 * @param {String} str string to check if its a mobile phone number
 *
 * @return {Boolean} true if a mobile number else false
 */
exports.isMobilePhone = str => validator.isMobilePhone(str, 'en-NG')

/**
 * @param {Array} inputFields an array of form input fields
 * @param {Object} inputFieldObj an object containing form inputs
 * @return {Boolean} true if all fields are contained
 */
exports.hasEmptyField = (inputFields, inputFieldObj) => {
  if (Object.keys(inputFieldObj).key === 0) return true
  const emptyField = inputFields.find(field => !inputFieldObj[field])
  if (emptyField) return true
  return false
}

/**
 * Perform mongoose validation for all field inputs
 * @param {Object} reqFieldsObj An object containing all input fields
 * @param {Object} Model a mongoose model
 *
 * @return {ValidationError} a validation  error object
 */
exports.mongoModelValidation = (reqFieldsObj, Model) => {
  const user = new Model()
  Object.keys(reqFieldsObj).forEach((field) => {
    user[field] = reqFieldsObj[field]
  })

  const errorMsg = user.validateSync()
  return errorMsg
}
