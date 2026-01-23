
import express from "express";
import { CreateCallingStudent, GetTodayCallingStudents,

    UpdateCallingStatus
 } from "../controllers/StudentCalling.controller.js";

//creating express router.

const router = express.Router();

//Post route 

router.post('/create-student-calling',  CreateCallingStudent);

router.post('/get-student-calling',  GetTodayCallingStudents);


router.post('/update-student-calling',  UpdateCallingStatus);




export default router;