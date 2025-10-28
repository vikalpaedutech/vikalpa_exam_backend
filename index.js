require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const StudentRoute = require('./routes/StudentRoute');
const DistrictBlockSchoolRoute = require('./routes/DistrictBlockSchoolRoute');
const UserRoute = require('./routes/UserRoute');
const cors = require('cors');
const BulkUPloadRoute = require('./routes/BulkUploadRoute');
// const TwilioRoute = require ('./routes/TwilioRoute');
const DashBoardRoute = require('./routes/DashBoardRoute');
const VerificationRoute = require('./routes/VerificationRoute');
const DistrictBlockCentersRoute = require('./routes/DistrictBlockCentersRoute');
const RommAndBedRoute = require("./routes/RoomAndBedRoute");
const PrincipalSchoolAbrcDataCollectionRoute = require("./routes/PrincipalSchoolAbrcDataCollectionRoute")

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
//         await mongoose.connect("mongodb+srv://examination:_tW2fzBfQj!8cDW@examination.z8te9.mongodb.net/examination");
//         console.log("MongoDB connected successfully");
//     } catch (error) {
//         console.error("MongoDB connection error:", error.message);
//     }        
// }

// // Call the function to connect
// connectDb();


// "mongodb+srv://mbshbuhamshah:UReCN8RsIy3RDYJD@mvcbackend.arkoj.mongodb.net/Examination?retryWrites=true&w=majority&appName=mvcBackend"

async function connectDb() {
    console.log('hello db')
    // try {
    //     await  mongoose.createConnection(
    //        "mongodb+srv://vikalpaedutech:Vikalpa%40123Foundation%40321@vikalpa.z8te9.mongodb.net/examination" , 
    //         {
    //             useNewUrlParser: true,
    //             useUnifiedTopology: true,
    //             serverSelectionTimeoutMS: 50000, // Increases connection timeout
    //             socketTimeoutMS: 45000,          // Increases socket timeout
    //             maxPoolSize: 50,                 // Limits the max number of connections in the connection pool
    //             bufferCommands: false            // Prevents mongoose from buffering commands when the connection is down
    //         }
    //     );
    //     console.log("MongoDB connected successfully yeah!");
    // } catch (error) {
    //     console.error("MongoDB connection error:", error.message);
    // }


      try {
        
      const  connectionToDb = await mongoose.connect("mongodb+srv://mbshbuhamshah:UReCN8RsIy3RDYJD@mvcbackend.arkoj.mongodb.net/Examination?retryWrites=true&w=majority&appName=mvcBackend");
      
      console.log(`Mongo Db Connected:${connectionToDb.connection.host} `); //${connectionToDb.connection.host}
        
    } catch (error) {

        console.log(`Error: ${error.message}`);

        process.exit(1)
        
    };



}

// Call the function to connect
connectDb();

// Use the StudentRoute
app.use('/api', StudentRoute);
app.use('/api',DistrictBlockSchoolRoute);
app.use('/api', UserRoute);
app.use('/api', BulkUPloadRoute)
// app.use('/api/notifications', TwilioRoute);
app.use('/api', DashBoardRoute);
app.use('/api', VerificationRoute)
app.use('/api', DistrictBlockCentersRoute);
app.use('/api', RommAndBedRoute);

app.use('/api',PrincipalSchoolAbrcDataCollectionRoute);


app.listen(PORT, function() {
    console.log('Server is running on port ' + PORT);
});























// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const connectDb = require('./db');

// // Routes
// const StudentRoute = require('./routes/StudentRoute');
// const DistrictBlockSchoolRoute = require('./routes/DistrictBlockSchoolRoute');
// const UserRoute = require('./routes/UserRoute');
// const BulkUploadRoute = require('./routes/BulkUploadRoute');
// const DashBoardRoute = require('./routes/DashBoardRoute');
// const VerificationRoute = require('./routes/VerificationRoute');
// const DistrictBlockCentersRoute = require('./routes/DistrictBlockCentersRoute');
// const RoomAndBedRoute = require('./routes/RoomAndBedRoute');

// const app = express();
// const PORT = process.env.PORT || 8000;

// // CORS
// app.use(cors({
//     origin: [process.env.CORS_ORIGIN, 'http://registration.buniyaadhry.com', 'http://localhost:3000'],
//     methods: ["GET","POST","PUT","PATCH","DELETE"],
//     credentials: true
// }));

// app.use(express.json());

// // Connect to MongoDB
// (async () => {
//   await connectDb(); // call ek hi baar
// })();

// // Routes
// app.use('/api', StudentRoute);
// app.use('/api', DistrictBlockSchoolRoute);
// app.use('/api', UserRoute);
// app.use('/api', BulkUploadRoute);
// app.use('/api', DashBoardRoute);
// app.use('/api', VerificationRoute);
// app.use('/api', DistrictBlockCentersRoute);
// app.use('/api', RoomAndBedRoute);

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });
