//routes for student.controller.js

import express from "express";

import { CreateCallLogs , GetCallLogsCurrentData } from "../controllers/ABRC_principal_beo_callingController.js";

//creating express router.

const router = express.Router();

//Post route 

router.post('/create-call-logs', CreateCallLogs);

router.post('/fetch-calllogs-by-callerid', GetCallLogsCurrentData)

// Upload dress size PDF for a student

export default router;