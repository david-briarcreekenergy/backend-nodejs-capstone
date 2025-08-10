const express = require('express')
const multer = require('multer')
const router = express.Router()
const connectToDatabase = require('../models/db')
const logger = require('../logger')

// Define the upload directory path
const directoryPath = 'public/images'

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath) // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // Use the original file name
  }
})

const upload = multer({ storage })

// Get all secondChanceItems
router.get('/', async (req, res, next) => {
  logger.info('/ called')
  try {
    // Step 2: task 1 - insert code here
    const db = await connectToDatabase()

    // Step 2: task 2 - insert code here
    const collection = db.collection('secondChanceItems')

    // Step 2: task 3 - insert code here
    const secondChanceItems = await collection.find({}).toArray()

    // Step 2: task 4 - insert code here
    res.json(secondChanceItems)
  } catch (e) {
    logger.console.error('oops something went wrong', e)
    next(e)
  }
})

// Add a new item
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    // Step 3: task 1 - insert code here
    const db = await connectToDatabase()

    // Step 3: task 2 - insert code here
    const collection = db.collection('secondChanceItems')

    // Step 3: task 3 - insert code here
    let secondChanceItem = req.body

    // Step 3: task 4 - insert code here
    const lastItems = await collection
      .find()
      .sort({ id: -1 })
      .limit(1)
      .toArray()
    const lastItem = lastItems[0]
    const nextId = parseInt(lastItem.id) + 1
    secondChanceItem.id = nextId
    secondChanceItem.date_added = Date.now()
    secondChanceItem = await collection.insertOne(secondChanceItem)

    // Step 3: task 5 - insert code here
    res.status(201).json(secondChanceItem)
  } catch (e) {
    next(e)
  }
})

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
  try {
    // Step 4: task 1 - insert code here
    const db = await connectToDatabase()

    // Step 4: task 2 - insert code here
    const collection = db.collection('secondChanceItems')

    // Step 4: task 3 - insert code here
    const id = req.params.id
    const secondChanceItem = await collection.findOne({ id })

    // Step 4: task 4 - insert code here
    if (!secondChanceItem) {
      return res.status(404).send('secondChanceItem not found')
    }

    res.json(secondChanceItem)
  } catch (e) {
    next(e)
  }
})

// Update and existing item
router.put('/:id', async (req, res, next) => {
  try {
    // Step 5: task 1 - insert code here
    const db = await connectToDatabase()

    // Step 5: task 2 - insert code here
    const collection = db.collection('secondChanceItems')

    // Step 5: task 3 - insert code here
    const id = req.params.id
    const secondChanceItem = await collection.findOne({ id })

    if (!secondChanceItem) {
      return res.status(404).send('secondChanceItem not found')
    }

    // Step 5: task 4 - insert code here
    const category = req.body.category
    const condition = req.body.condition
    const ageDays = req.body.age_days
    const description = req.body.description
    const updateFields = {}
    if (category !== undefined) updateFields.category = category
    if (condition !== undefined) updateFields.condition = condition
    if (ageDays !== undefined) {
      updateFields.age_days = ageDays
      // Calculate age_years to one decimal place
      updateFields.age_years = Number((ageDays / 365).toFixed(1))
    }
    if (description !== undefined) updateFields.description = description
    // Add any other custom properties
    updateFields.updatedAt = new Date()
    Object.assign(updateFields)
    await collection.updateOne({ id }, { $set: updateFields })
    const updatedItem = await collection.findOneAndUpdate(
      { id },
      { $set: updateFields },
      { returnDocument: 'after' }
    )

    // Step 5: task 5 - insert code here
    updatedItem
      ? res.json({ updated: 'success' })
      : res.json({ updated: 'failed' })
  } catch (e) {
    next(e)
  }
})

// Delete an existing item
router.delete('/:id', async (req, res, next) => {
  try {
    // Step 6: task 1 - insert code here
    const db = await connectToDatabase()

    // Step 6: task 2 - insert code here
    const collection = db.collection('secondChanceItems')

    // Step 6: task 3 - insert code here
    const id = req.params.id
    const secondChanceItem = await collection.findOne({ id })

    if (!secondChanceItem) {
      return res.status(404).send('secondChanceItem not found')
    }

    // Step 6: task 4 - insert code here
    await collection.deleteOne({ id })
    res.json({ deleted: 'success' })
  } catch (e) {
    next(e)
  }
})

module.exports = router
