const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const morgan = require('morgan')
const config = require('./config/index')

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

// Connect to Database
mongoose.connect(process.env.DATABASE_SERVER, (err) => {
  if (err) {
    logger.error(err)
  } else {
    logger.info('Successfully Connected to the database')
  }
})

app.listen(process.env.PORT)

logger.log(`Listening @ port ${process.env.PORT}`)
