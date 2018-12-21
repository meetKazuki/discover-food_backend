// Import .env variables as process.ENV.variable
require('dotenv').config()

const environments = {}

environments.development = {
  port: process.env.PORT,
  envName: 'development',
  dbUrl: process.env.DATABASE_SERVER,
  tokenSecret: process.env.TOKEN_SECRET,
  hashSecret: process.env.HASH_SECRET,
  mailjetPublicKey: process.env.MAIL_JET_PUBLIC_KEY,
  mailjetSecretKey: process.env.MAIL_JET_SECRET_KEY,
  mailjetEmailSender: process.env.MAIL_JET_EMAIL_SENDER,
  mailjetVersion: process.env.MAIL_JET_VERSION,
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY,
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
  geocodingApiKey: process.env.GEOCODING_API_KEY,
  distanceMatrixApiKey: process.env.DISTANCE_MATRIX_API_KEY,
  firebaseCloudMessagingApiKey: process.env.FIREBASE_CLOUD_MSG_API_KEY,
  firebaseCloudMessagingRegWebToken: process.env.FIREBASE_CLOUD_MSG_REG_WEB_TOKEN
}

environments.production = {
  port: process.env.PROD_PORT,
  envName: 'production',
  dbUrl: process.env.DATABASE_SERVER,
  tokenSecret: process.env.TOKEN_SECRET,
  hashSecret: process.env.HASH_SECRET,
  mailjetPublicKey: process.env.MAIL_JET_PUBLIC_KEY,
  mailjetSecretKey: process.env.MAIL_JET_SECRET_KEY,
  mailjetEmailSender: process.env.MAIL_JET_EMAIL_SENDER,
  mailjetVersion: process.env.MAIL_JET_VERSION,
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY,
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
  geocodingApiKey: process.env.GEOCODING_API_KEY,
  distanceMatrixApiKey: process.env.DISTANCE_MATRIX_API_KEY
}

const currentEnvironment = typeof process.env.NODE_ENV === 'string'
  ? process.env.NODE_ENV.toLowerCase() : ''

const environmentToExport = typeof
(environments[currentEnvironment]) === 'object'
  ? environments[currentEnvironment]
  : environments.development

module.exports = environmentToExport
