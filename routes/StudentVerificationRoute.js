//routes for student.controller.js

import express from "express";

import { GetStudentdsDataForVerification, UpdateStudentVerification,
BulkUploadVerification, GetWrongAadharData

 } from "../controllers/StudentVerificationController.js";

//creating express router.

const router = express.Router();

//Post route 

router.post('/get-student-data-for-verification',  GetStudentdsDataForVerification);

router.patch('/patch-student-data-for-verification',  UpdateStudentVerification);



router.post('/aadhar-correction-data',  GetWrongAadharData);




router.post('/get-bulk-verification-data',  BulkUploadVerification);

export default router;