const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');
const bcrypt = require('bcryptjs');

router.post('/register', async (req, res) => {
  try {
    // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
    const db = await connectToDatabase();

    // Task 2: Access MongoDB `users` collection
    const collection = db.collection('users');

    // Task 3: Check if user credentials already exists in the database and throw an error if they do
    const email = req.body.email;
    const plainPassword = req.body.password;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    if (!email || !plainPassword || !firstName || !lastName) {
      return res
        .status(400)
        .json({ message: 'Request must include all fields' });
    }

    const user = await collection.findOne({ email: email });

    if (user) {
      const msg = 'email already exists';
      logger.error(msg);
      return res.status(400).send(msg);
    }

    // Task 4: Create a hash to encrypt the password so that it is not readable in the database
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // Task 5: Insert the user into the database
    const newUser = await collection.insertOne({
      email: email,
      password: hashedPassword,
      firstName: firstName,
      lastName: lastName,
      createdAt: new Date(),
    });

    // Task 6: Create JWT authentication if passwords match with user._id as payload
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: newUser.insertedId },
      process.env.JWT_SECRET || 'adsfgkjeinoceoiwj83239y54njfnao09u',
      { expiresIn: '1h' },
    );

    // Task 7: Log the successful registration using the logger
    logger.info('User successfully registered');

    // Task 8: Return the user email and the token as a JSON
    res.json({ email, token });
  } catch (e) {
    logger.error(e);
    // return res.status(500).send('Internal server error');
    return res.status(500).json({ error: e });
  }
});

module.exports = router;
