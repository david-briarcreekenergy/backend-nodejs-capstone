const express = require('express')
const router = express.Router()
const connectToDatabase = require('../models/db')
const logger = require('../logger')
const bcrypt = require('bcrypt')
const { body, validationResult } = require('express-validator')

router.post('/register', async (req, res) => {
  try {
    // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
    const db = await connectToDatabase()

    // Task 2: Access MongoDB `users` collection
    const collection = db.collection('users')

    // Task 3: Check if user credentials already exists in the database and throw an error if they do
    const email = req.body.email
    const plainPassword = req.body.password
    const firstName = req.body.firstName
    const lastName = req.body.lastName
    if (!email || !plainPassword || !firstName || !lastName) {
      return res
        .status(400)
        .json({ message: 'Request must include all fields' })
    }

    const user = await collection.findOne({ email })

    if (user) {
      const msg = 'email already exists'
      logger.error(msg)
      return res.status(400).send(msg)
    }

    // Task 4: Create a hash to encrypt the password so that it is not readable in the database
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds)

    // Task 5: Insert the user into the database
    const newUser = await collection.insertOne({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      createdAt: new Date()
    })

    // Task 6: Create JWT authentication if passwords match with user._id as payload
    const jwt = require('jsonwebtoken')
    const token = jwt.sign(
      { userId: newUser.insertedId },
      process.env.JWT_SECRET || 'adsfgkjeinoceoiwj83239y54njfnao09u',
      { expiresIn: '1h' }
    )

    // Task 7: Log the successful registration using the logger
    logger.info('User successfully registered')

    // Task 8: Return the user email and the token as a JSON
    res.json({ email, token })
  } catch (e) {
    logger.error(e)
    return res.status(500).send('Internal server error')
    // return res.status(500).json({ error: e });
  }
})

router.post('/login', async (req, res) => {
  try {
    // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
    const db = await connectToDatabase()

    // Task 2: Access MongoDB `users` collection
    const collection = db.collection('users')

    // Task 3: Check for user credentials in database
    let { email = null, password = null } = req.body
    email = email.trim()
    password = password.trim()

    if (!email || email === '' || !password || password === '') {
      return res
        .status(400)
        .json({ message: 'email and password are required for login' })
    }

    const user = await collection.findOne({ email })

    if (user) {
      // Task 4: Check if the password matches the encrypted password and send appropriate message on mismatch
      const passwordMatch = await bcrypt.compare(password, user.password)
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid password' })
      }

      // Task 5: Fetch user details from a database
      const userName = user.firstName
      const userEmail = user.email

      // Task 6: Create JWT authentication if passwords match with user._id as payload
      const jwt = require('jsonwebtoken')
      const authtoken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'adsfgkjeinoceoiwj83239y54njfnao09u',
        { expiresIn: '1h' }
      )

      return res.json({ authtoken, userName, userEmail })
    }

    // Task 7: Send appropriate message if the user is not found
    logger.error('user not found')
    return res.status(404).send('user not found')
  } catch (e) {
    logger.error(e)
    return res.status(500).send('Internal server error')
  }
})

// {Insert it along with other imports} Task 1: Use the `body`,`validationResult` from `express-validator` for input validation

router.put(
  '/update',
  body('email').trim().notEmpty().isEmail(),
  body('password').trim().notEmpty(),
  async (req, res) => {
    // Task 2: Validate the input using `validationResult` and return an appropriate message if you detect an error
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      logger.error('Validation errors', errors.array())
      return res.status(400).json({ errors: errors.array() })
    }
    try {
      // Task 3: Check if `email` is present in the header and throw an appropriate error message if it is not present
      const email = req.headers.email.trim()
      if (!email) {
        const msg = 'Email not in request headers'
        logger.error(msg)
        return res.status(400).json({ error: msg })
      }

      // Task 4: Connect to MongoDB
      const db = await connectToDatabase()

      // Task 5: Find the user credentials in database
      const collection = db.collection('users')

      const existingUser = await collection.findOne({ email })
      existingUser.updatedAt = new Date()

      // Task 6: Update the user credentials in the database

      // Destructure req.body and update only provided fields
      const { password, firstName, lastName } = req.body
      const updateFields = {}
      if (password !== undefined) {
        const saltRounds = 10
        updateFields.password = await bcrypt.hash(password, saltRounds)
      }
      if (firstName !== undefined) updateFields.firstName = firstName
      if (lastName !== undefined) updateFields.lastName = lastName
      updateFields.updatedAt = new Date()

      const updatedUser = await collection.findOneAndUpdate(
        { email },
        { $set: updateFields },
        { returnDocument: 'after' }
      )

      // Task 7: Create JWT authentication with `user._id` as a payload using the secret key from the .env file
      const jwt = require('jsonwebtoken')
      const authtoken = jwt.sign(
        { userId: updatedUser._id },
        process.env.JWT_SECRET || 'adsfgkjeinoceoiwj83239y54njfnao09u',
        { expiresIn: '1h' }
      )
      res.json({ authtoken })
    } catch (e) {
      logger.error(e)
      //   return res.status(500).send('Internal server error');
      return res.status(500).json({ error: e })
    }
  }
)

module.exports = router
