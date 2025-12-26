

import express from "express"

import { createExaminationCenter,GetCentersDataByExaminationAndExamType, 
    updateExaminationCentersAndCapacity } from "../controllers/ExaminationCentersAndCapaictyController.js";
const router = express();




 router.post("/create-examination-centers", createExaminationCenter)
 router.post("/get-examination-centers", GetCentersDataByExaminationAndExamType)

  router.post("/update-center-attendance", updateExaminationCentersAndCapacity)





export default router;