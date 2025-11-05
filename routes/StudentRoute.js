//routes for student.controller.js

import express from "express";

import { createStudent,updateStudent, uploadImage,
    getStudentBySrnNumberOrSlipId
 } from "../controllers/StudentController.js";

//creating express router.

const router = express.Router();

//Post route 

router.post('/student', uploadImage,  createStudent);
router.patch("/update-student",uploadImage, updateStudent);

router.post("/get-student", getStudentBySrnNumberOrSlipId);
// Upload dress size PDF for a student

export default router;