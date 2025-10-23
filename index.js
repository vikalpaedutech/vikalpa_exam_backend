require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const StudentRoute = require('./routes/StudentRoute');
const DistrictBlockSchoolRoute = require('./routes/DistrictBlockSchoolRoute');
const UserRoute = require('./routes/UserRoute');
const cors = require('cors');
const BulkUPloadRoute = require('./routes/BulkUploadRoute');
const TwilioRoute = require ('./routes/TwilioRoute');
const DashBoardRoute = require('./routes/DashBoardRoute');
const VerificationRoute = require('./routes/VerificationRoute');
const DistrictBlockCentersRoute = require('./routes/DistrictBlockCentersRoute');
const RommAndBedRoute = require("./routes/RoomAndBedRoute");


const app = express();
const PORT = process.env.PORT || 8000;


app.use(cors({
    origin: [process.env.CORS_ORIGIN, 'http://registration.buniyaadhry.com', 'http://localhost:3000'],
    methods: ["GET","POST","PUT","PATCH","DELETE"],
    credentials: true
}));

app.use(express.json()); // Middleware to parse JSON requests

//connecting to db

// async function connectDb() {
//     try {
//         await mongoose.connect("mongodb+srv://mbshbuhamshah:UReCN8RsIy3RDYJD@mvcbackend.arkoj.mongodb.net/Examination?retryWrites=true&w=majority&appName=mvcBackend");
//         console.log("MongoDB connected successfully");
//     } catch (error) {
//         console.error("MongoDB connection error:", error.message);
//     }        
// }

// // Call the function to connect
// connectDb();



async function connectDb() {
    try {
        await mongoose.connect(
            "mongodb+srv://mbshbuhamshah:UReCN8RsIy3RDYJD@mvcbackend.arkoj.mongodb.net/Examination?retryWrites=true&w=majority&appName=mvcBackend", 
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 50000, // Increases connection timeout
                socketTimeoutMS: 45000,          // Increases socket timeout
                maxPoolSize: 50,                 // Limits the max number of connections in the connection pool
                bufferCommands: false            // Prevents mongoose from buffering commands when the connection is down
            }
        );
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
    }
}

// Call the function to connect
connectDb();

// Use the StudentRoute
app.use('/api', StudentRoute);
app.use('/api',DistrictBlockSchoolRoute);
app.use('/api', UserRoute);
app.use('/api', BulkUPloadRoute)
app.use('/api/notifications', TwilioRoute);
app.use('/api', DashBoardRoute);
app.use('/api', VerificationRoute)
app.use('/api', DistrictBlockCentersRoute);
app.use('/api', RommAndBedRoute);

app.listen(PORT, function() {
    console.log('Server is running on port ' + PORT);
});

