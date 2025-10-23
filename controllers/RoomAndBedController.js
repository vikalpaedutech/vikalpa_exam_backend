const mongoose = require('mongoose');
const RoomAndBed = require('../models/RoomAndBedModel'); // Correct model import

const Student = require('../models/StudentModel');

// POST API to create a new room and bed setup
const PostRoomAndBed = async (req, res) => {
    try {
        const { roomNo, gender, capacity, sequenceOfAllocation } = req.body;

        const newRoom = new RoomAndBed({
            roomNo,
            gender,
            capacity,
            occupied: 0, // Initially, no beds are occupied
            exhausted: false, // Initially, the room is not full,
            sequenceOfAllocation,
        });

        const roomData = await newRoom.save();
        res.status(200).send({ success: true, msg: 'Room created successfully', data: roomData });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

// GET API to fetch all rooms by gender (for male or female)
const GetRoomsByGender = async (req, res) => {
    try {
        const gender = req.params.gender;

        const rooms = await RoomAndBed.find({ gender });
        if (!rooms || rooms.length === 0) {
            return res.status(400).send({ success: false, msg: 'No rooms found for this gender' });
        }

        res.status(200).send({ success: true, msg: 'Rooms fetched successfully', data: rooms });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

// GET API to fetch room details by room number
const GetRoomByRoomNo = async (req, res) => {
    try {
        const roomNo = req.params.roomNo;

        const room = await RoomAndBed.findOne({ roomNo });
        if (!room) {
            return res.status(400).send({ success: false, msg: 'Room not found' });
        }

        res.status(200).send({ success: true, msg: 'Room details fetched successfully', data: room });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

// PUT API to update room occupancy
const UpdateRoomOccupancy = async (req, res) => {
    try {
        const roomNo = req.params.roomNo;

        // Fetch the room
        const room = await RoomAndBed.findOne({ roomNo });
        if (!room) {
            return res.status(400).send({ success: false, msg: 'Room not found' });
        }

        // Update the occupied count and check if the room is exhausted
        room.occupied += 1;

        if (room.occupied >= room.capacity) {
            room.exhausted = true; // Mark the room as exhausted when capacity is reached
        }

        await room.save();

        res.status(200).send({ success: true, msg: 'Room occupancy updated', data: room });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

// API to assign a student to a room and bed
const AssignStudentToRoom = async (req, res) => {
    try {
        const { studentId, gender } = req.body; // Student ID and Gender

        // Fetch available room for the specified gender
        const room = await RoomAndBed.findOne({ gender, exhausted: false, occupied: { $lt: 1 } }); // Find the first available room
        if (!room) {
            return res.status(400).send({ success: false, msg: 'No available rooms' });
        }

        // Assign student to the room
        room.occupied += 1; // Increment the occupied count
        if (room.occupied >= room.capacity) {
            room.exhausted = true; // Mark as full
        }

        await room.save();

        // Update student with the room and bed details (assuming `studentId` is a valid student)
        const student = await Student.findByIdAndUpdate(studentId, {
            roomNo: room.roomNo,
            bedNo: room.occupied, // Assign bed number based on occupancy
        });

        res.status(200).send({ success: true, msg: 'Student assigned to room', data: student });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

// GET API to check if room is exhausted or has available capacity
const CheckRoomAvailability = async (req, res) => {
    try {
        const roomNo = req.params.roomNo;

        const room = await RoomAndBed.findOne({ roomNo });
        if (!room) {
            return res.status(400).send({ success: false, msg: 'Room not found' });
        }

        res.status(200).send({ success: true, msg: 'Room availability fetched successfully', data: room });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};


// GET API to fetch room with smallest sequence and not exhausted, separately for Male and Female
const GetAvailableRoomsByGender = async (req, res) => {
    console.log(" i am inside GetAvailableRoomsByGender ")
    try {
        // For Male
        const maleRoom = await RoomAndBed.findOne({ gender: 'Male', exhausted: false })
            .sort({ sequenceOfAllocation: 1 })
            .lean();

        // For Female
        const femaleRoom = await RoomAndBed.findOne({ gender: 'Female', exhausted: false })
            .sort({ sequenceOfAllocation: 1 })
            .lean();

        res.status(200).send({
            success: true,
            data: {
                maleRoom,
                femaleRoom,
            },
        });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};




const UpdateOccupiedAndExhausted = async (req, res) => {
    try {
        const { roomNo } = req.params;
        const { occupied, logic } = req.body;
        
        console.log("i am logic", logic)




        console.log("i am inside updated occupied block", occupied);
        console.log(occupied, typeof(parseInt(roomNo)));

        const roomNumberToInt = parseInt(roomNo);

      

        // First, find the room by roomNo
        const room = await RoomAndBed.findOne({ roomNo: roomNumberToInt });

        if (!room) {
            return res.status(404).send({ success: false, msg: "Room not found" });
        }

        // Calculate the exhausted value based on room's capacity
       // const exhausted = occupied >= room.capacity;

        let exhausted;
        if (occupied>= room.capacity){exhausted = true}
        else {exhausted = false}


        if (logic === false){


             // Now, update the room's occupied and exhausted fields
        const updatedRoom = await RoomAndBed.findOneAndUpdate(
            { roomNo: roomNumberToInt },
            { 
                $set: { 
                    occupied:room.occupied-1, 
                    exhausted 
                }
            },
            { new: true } // Return the updated room
        );

        res.status(200).send({
            success: true,
            msg: "Room occupancy updated successfully",
            data: updatedRoom,
        });


        } else {


            // Now, update the room's occupied and exhausted fields
        const updatedRoom = await RoomAndBed.findOneAndUpdate(
            { roomNo: roomNumberToInt },
            { 
                $set: { 
                    occupied, 
                    exhausted 
                }
            },
            { new: true } // Return the updated room
        );

        res.status(200).send({
            success: true,
            msg: "Room occupancy updated successfully",
            data: updatedRoom,
        });




        }



       
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};


module.exports = {
    PostRoomAndBed,
    GetRoomsByGender,
    GetRoomByRoomNo,
    UpdateRoomOccupancy,
    AssignStudentToRoom,
    CheckRoomAvailability,
    GetAvailableRoomsByGender,
    UpdateOccupiedAndExhausted
};
