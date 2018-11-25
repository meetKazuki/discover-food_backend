// Import .env variables as process.ENV.variable
require('dotenv').config()

const environments = {}

environments.development = {
  port: process.env.PORT,
  envName: 'development',
  dbUrl: process.env.DATABASE_SERVER
}

environments.production = {
  port: process.env.PROD_PORT,
  envName: 'production'
}

const currentEnvironment = typeof process.env.NODE_ENV === 'string'
  ? process.env.NODE_ENV.toLowerCase() : ''

const environmentToExport = typeof
(environments[currentEnvironment]) === 'object'
  ? environments[currentEnvironment]
  : environments.development

module.exports = environmentToExport
