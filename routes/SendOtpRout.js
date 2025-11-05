//routes for SendOtp.route.js

import express from "express";

import { sendOtp } from "../controllers/SendOtpController.js";



const router = express.Router();

router.post('/send-otp', sendOtp);

export default router;
