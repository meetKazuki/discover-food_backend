# SETUP INSTRUCTION

- To setup your environmental variable, create a new file called .env  
  Copy the content of .env_example into .env 
  Edit the content to suit your needs

- run `npm install` in the terminal/command line to install all dependencies

- run `npm start` to start the app


## CODING INSTRUCTION

- Understanding the folder structure.
  `src`: All codes must be written inside this sub folder depending on the task as explained below
  `route`: Contains all your route. All route most be loaded from the `index.js` (child of index.js)
  `models`: Contain all the database schema/models
  `controller`: Contains functions that calls the route
  `functions`: Contain all the logic use by the controller.  

  NOTE: The `index.js` should only be use to load your route file as shown in the comment found inside the `index.js` file in the `route` directory. Create should create all your route inside the `route` folder loaded by the `index.js` file. 

- We use Eslint (airbnb) to enforce code standard and styling.
  When trying to start the app using the npm start, eslint is trigger to check for code conformity to standard.

- Although the eslint tries to fix some errors found, you must manually fix any eslint error before the app will run 
  Or before pushing to server

- Use different branch for working on different feature.

- Send PR (Pull Request) to the `develop` branch. 
  The EA (Enterprise Architechture) will review and approve or reject with reasons as the case may be.

- Branch Flow:
  `master`: Contain the clean working code.
  `develop`: New feature_branch must be created from this branch
  `feature_branch`: You must create a new branch when starting a new feature from the develop branch 
                    git branch develop
                    git checkout -b login_feature

- No adjustment should be made to the `app.js` in the root directory or any other files in the root directory. 
  All changes should be done inside the `src` sub folder.

- Environmental variables should be entered into the .env file instead. 
  The environmental variable set can be access in your node app using process.env.VARABLE_NAME

- No console.log is allowed. Please import the `logger.js` file under the `config` folder in the root directory
  Before you can use the logger function, you must enable the DEBUG environment variable (DEBUG=true) in the .env file
  e.g const logger = require('./config/logger')
      logger.log('for debug and loging purpose')
      logger.error('Use to log error'); 
