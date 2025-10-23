const express = require('express');
const RoomRoute = express();
const RoomController = require('../controllers/RoomAndBedController');

// POST route to create a new room and bed setup
RoomRoute.post('/create-room', RoomController.PostRoomAndBed);

// GET route to fetch rooms by gender (male/female)
RoomRoute.get('/rooms/:gender', RoomController.GetRoomsByGender);

// GET route to fetch room details by room number
RoomRoute.get('/room/:roomNo', RoomController.GetRoomByRoomNo);

// PUT route to update room occupancy
RoomRoute.put('/update-occupancy/:roomNo', RoomController.UpdateRoomOccupancy);

// POST route to assign a student to a room and bed
RoomRoute.post('/assign-student', RoomController.AssignStudentToRoom);

// GET route to check if room is exhausted or has available capacity
RoomRoute.get('/check-room-availability/:roomNo', RoomController.CheckRoomAvailability);


// GET route to fetch available rooms separately for Male and Female
RoomRoute.get('/available-rooms', RoomController.GetAvailableRoomsByGender);

RoomRoute.put('/update-occupied/:roomNo', RoomController.UpdateOccupiedAndExhausted);


module.exports = RoomRoute;
