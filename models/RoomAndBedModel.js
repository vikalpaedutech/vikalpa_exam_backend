const mongoose = require("mongoose");

const roomAndBedSchema = new mongoose.Schema(
  {
    roomNo: { type: Number, required: true }, // Room number (201, 202, etc.)
    gender: { type: String, required: true }, // Male or Female
    capacity: { type: Number, required: true }, // Maximum bed capacity in the room
    occupied: { type: Number, default: 0 }, // Tracks how many beds are occupied
    exhausted: { type: Boolean, default: false }, // Indicates if room is full
    sequenceOfAllocation: {type:Number, required: true},
  },
  { timestamps: true }
);

// Export the model instead of just the schema
const RoomAndBed = mongoose.model("RoomAndBed", roomAndBedSchema);

module.exports = RoomAndBed;
