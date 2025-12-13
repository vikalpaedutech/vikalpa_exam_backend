

import express from "express"

import { createPost, GetDistrictBlockSchoolByParams, updateAbrcPrincipal, updateSchoolCenterPreferences } from "../controllers/District_block_schoolsController.js";

const router = express();


router.post("/create_district_block_buniyaadCenter_data", createPost);

router.post("/get-district-block-schools", GetDistrictBlockSchoolByParams)

 router.post("/update-abrc-principal", updateAbrcPrincipal)


 router.post("/update-school-prefrences",updateSchoolCenterPreferences)


export default router;