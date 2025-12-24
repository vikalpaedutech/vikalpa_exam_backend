//routes for student.controller.js

import express from "express";

import { createStudent,updateStudent, uploadImage,
    getStudentBySrnNumberOrSlipId, 
    IsAdmitCardDownloaded, updateStudentAadhar, GetAttendanceSheetData
 } from "../controllers/StudentController.js";

//creating express router.

const router = express.Router();

//Post route 

router.post('/student', uploadImage,  createStudent);
router.patch("/update-student",uploadImage, updateStudent);

router.post("/get-student", getStudentBySrnNumberOrSlipId);


router.post("/admit-card-downloaded", IsAdmitCardDownloaded);
// Upload dress size PDF for a student




router.post("/update-aadhar", updateStudentAadhar);

router.post("/get-attendance-sheet-data", GetAttendanceSheetData)

export default router;