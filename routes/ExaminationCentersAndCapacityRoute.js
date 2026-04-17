

import express from "express"

import { createExaminationCenter,GetCentersDataByExaminationAndExamType, 
    updateExaminationCentersAndCapacity, GetCentersDataByExaminationAndExamTypeS100 } from "../controllers/ExaminationCentersAndCapaictyController.js";
const router = express();




 router.post("/create-examination-centers", createExaminationCenter)
 router.post("/get-examination-centers", GetCentersDataByExaminationAndExamType)
  router.post("/get-examination-centers-s100", GetCentersDataByExaminationAndExamTypeS100)

  router.post("/update-center-attendance", updateExaminationCentersAndCapacity)





export default router;