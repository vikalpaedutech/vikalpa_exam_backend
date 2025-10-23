const mongoose = require('mongoose');

// Define the schema
const tokenCounterSchema = new mongoose.Schema({
  _id: {
    type: String, // e.g., "Panipat"
    required: true
  },
  seq: {
    type: Number,
    required: true,
    default: 0
  }
}, { collection: 'mbl3tokens' }); // Make sure it uses the right collection name

// Create the model
const TokenCounter = mongoose.models.TokenCounter || mongoose.model('TokenCounter', tokenCounterSchema);

// Main function to get the next sequence number
const getNextSequence = async (key) => {
  try {
    const result = await TokenCounter.findOneAndUpdate(
      { _id: key },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    if (!result) {
      throw new Error(`Failed to generate token for key: ${key}`);
    }

    return result.seq;

  } catch (err) {
    console.error(`getNextSequence failed for '${key}':`, err);
    throw err;
  }
};

module.exports = getNextSequence;
