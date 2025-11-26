//routes for student.controller.js

import express from "express";


import { GetStudentsRegisteredByUserCount, GetStudentsRegisteredByUser,
    DashboardCounts, GetRegisteredStudentsDataBySchoolAndClass,
    MainDashBoard, getCallSummary
 } from "../controllers/DashBoardController.js";
//creating express router.

const router = express.Router();

//Post route 

router.post('/get-students-registered-by-user-count',  GetStudentsRegisteredByUserCount);

router.post('/get-students-registered-by-user',  GetStudentsRegisteredByUser);

router.get('/l1-dashboard-counts',  DashboardCounts);

router.post('/get-registered-students-data-by-class',  GetRegisteredStudentsDataBySchoolAndClass);

router.post('/main-dashboard',  MainDashBoard);

router.post('/calling-dashboard',  getCallSummary);




export default router;