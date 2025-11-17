

import express from "express"

import { CreatePrincipalCallLeads, CreateABRCLeads, GetCallLeadsByUserObjectId,

    UpdateCallLeads, GetDistrictBlockSchoolsByContact
} from "../controllers/CallLeadsController.js";
const router = express();




 router.post("/create-call-leads", CreatePrincipalCallLeads)


 
 router.post("/create-abrc-call-leads", CreateABRCLeads)


  router.post("/get-call-leads", GetCallLeadsByUserObjectId)


   router.post("/update-call-leads", UpdateCallLeads)

   
   router.post("/get-district-block-schools-by-contact", GetDistrictBlockSchoolsByContact)



export default router;