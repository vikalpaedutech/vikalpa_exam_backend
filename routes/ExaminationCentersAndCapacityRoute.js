

import express from "express"

import { createExaminationCenter,GetCentersDataByExaminationAndExamType } from "../controllers/ExaminationCentersAndCapaictyController.js";
const router = express();




 router.post("/create-examination-centers", createExaminationCenter)
 router.post("/get-examination-centers", GetCentersDataByExaminationAndExamType)





export default router;