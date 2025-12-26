
//This will be the entry point of our app.

//env configuration
import dotenv from "dotenv";

//import {createAttendanceRecords} from "./controllers/cronAttendance.controller.js"

dotenv.config();

//______________________________

//importing mongodb connection file.
import connectDb from "./dbConfig/db.js";

//___________________________________

//importing our express app main file. app.js.
import {app} from "./app.js";

//________________________________________________





connectDb()
.then(() => {
   app.listen(process.env.PORT || 8000, () => {
    console.log(`Sercer is running on port: ${process.env.PORT}`)
   }) 
})
.catch((error) => {
    console.log("MongoDb connection failed", error)
}
);