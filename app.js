const express = require('express')
const path = require('path')
const morgan = require('morgan')
const db = require('./utils/db')
const config = require('./config/index.js')

const route = require('./src/routes/')
const logger = require('./config/logger')

const app = express()

// Parse the payload and add to request.body
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

// Setup morgan dev
app.use(morgan('dev'))

// All route should be added to the index.js file inside the route folder
app.use('/', route)

// Handle the error
app.use((err, req, res, next) => {
  logger.error(err)
})

db.connect(config.dbUrl)

app.listen(config.port)

logger.log(`Listening @ port ${config.port}`)
