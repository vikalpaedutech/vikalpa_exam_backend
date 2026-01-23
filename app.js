//Creating express app here

import express from "express";
// import {createAttendanceRecords} from "./controllers/studentAttendance.controller.js"
// import { createAttendancePdfCronJob } from "./controllers/UploadAttendancePdf.controller.js";
// import { cronJobUserAttendance } from "./controllers/userAttendance.controller.js";

//Importing necessary packages.

import cors from "cors";

import cookieParser from "cookie-parser";

import bodyParser from "body-parser";

const {json, urlencoded} = bodyParser;

//_______________________________________________________________

//all middle wares and configuration are done by using app.use() method.

// creating expres app.

const app = express ();

//cors configuration.

app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true
}))

//_____________________________________________

//Configuration for accepting json format from frontend

app.use(json({
    limit: "16kb"
}));

//___________________________________________________________

app.use(express.json());

//Configuration for accepting url-encoded data.

app.use(urlencoded({
    extended:true,
    limit:"16kb"
}));

//Somtimes we would want to store public assests like images, doc, or any type of media...
//...So following is the configuration for that.

app.use(express.static("public"));

//____________________________________________________________________

//cookie-parser confugration.

app.use(cookieParser());

//______________________________________


//Below method runs every once in a day at a fixed time for studentAttendanceDump.
//cronAttendance
//  createAttendanceRecords();
//cronJobUserAttendance();

// createAttendancePdfCronJob(); //This initializes the data in db.

//____________________________________


// //Importing routers

// import districtRouter from "./routes/district.route.js";

import StudentRoute from "./routes/StudentRoute.js"
import Disrict_block_schoolsRoute from "./routes/District_block_schoolsRoute.js"
import UserRoute from "./routes/UserRoute.js"
import StudentVerificationRoute from "./routes/StudentVerificationRoute.js"
import DashboardRoute from "./routes/DashBoardRoute.js"
import SendOtpRoute from "./routes/SendOtpRout.js"
import ABRC_principal_beo_calling from "./routes/ABRC_principal_beo_callingRoute.js"
import CallLeadsRoute from "./routes/CallLeadsRoute.js"
import ExaminationCentersAndCapacityRoute from "./routes/ExaminationCentersAndCapacityRoute.js"
import StudentCallingRoute from "./routes/StudentCallingRoute.js"
// //using routes for route.g

// app.use('/api', districtRouter);
// app.use("/api", blockRouter);
// app.use("/api", schoolRouter);
app.use("/api", StudentRoute);
app.use("/api", Disrict_block_schoolsRoute);
app.use("/api", UserRoute);
app.use("/api", StudentVerificationRoute);
app.use("/api", DashboardRoute);
app.use("/api", SendOtpRoute);
app.use("/api", ABRC_principal_beo_calling);
app.use("/api", CallLeadsRoute);
app.use("/api", ExaminationCentersAndCapacityRoute);
app.use("/api", StudentCallingRoute);

// app.use("/api", studentAttendanceRouter);
// app.use("/api", examAndTestRouter);
// app.use("/api", marksRouter);
// app.use("/api", billsRouter);
// app.use("/api", empLeaveRouter);
// app.use("/api", userRouter);
// app.use("/api", studentDisciplinaryRouter);
// app.use("/api", centerOrSchoolDisciplinaryRouter);
// app.use("/api", UploadAttendancePdfRouter);
// app.use("/api", userAttendanceRouter);
// app.use("/api", StudentRelatedCallingsRouter);
// app.use("/api", ConcernsRouter);
// app.use("/api", dashboardRouter)
// app.use("/api", notificationRouter)
// app.use("/api", district_block_buniyaadCentersRoute)
// app.use("/api", sendOtp)
// app.use("/api",disciplinaryGamificationRoute)
// app.use("/api",s100AttendanceRoute)
// app.use("/api",gamificationRoute)
// app.use("/api",ErpTestRoute)



//Exporting this express app.

export {app};

//__________________________

