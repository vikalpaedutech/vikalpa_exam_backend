//routes for student.controller.js

import express from "express";

import { createStudent,updateStudent, uploadImage,
    getStudentBySrnNumberOrSlipId, 
    IsAdmitCardDownloaded, updateStudentAadhar, GetAttendanceSheetData, FetchMbL2QualifiedStudent,markL3AttendanceOfStudents
    , GetAttendanceSheetDataS100, GetAttendanceSheetDataCounselling,
    MarkCounsellingAttendance
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

router.post("/get-attendance-sheet-data-s100", GetAttendanceSheetDataS100)

router.post("/fetch-mb-l2-qualified-student", FetchMbL2QualifiedStudent)

router.post("/update-level3-attendance", markL3AttendanceOfStudents)

router.post("/get-attendance-sheet-counselling", GetAttendanceSheetDataCounselling)

router.post("/mark-counselling-attendance", MarkCounsellingAttendance)

export default router;