

import express from "express"

import { CreatePrincipalCallLeads, CreateABRCLeads, GetCallLeadsByUserObjectId,

    UpdateCallLeads
} from "../controllers/CallLeadsController.js";
const router = express();




 router.post("/create-call-leads", CreatePrincipalCallLeads)


 
 router.post("/create-abrc-call-leads", CreateABRCLeads)


  router.post("/get-call-leads", GetCallLeadsByUserObjectId)


   router.post("/update-call-leads", UpdateCallLeads)


export default router;