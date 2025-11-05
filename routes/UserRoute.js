//routes for student.controller.js

import express from "express";

import { createOrUpdateUser, getUserWithAccessById, getUserWithMobileAndPassword,
    changePasswordUsingMobile
 } from "../controllers/UserController.js";

//creating express router.

const router = express.Router();

//Post route 

router.post('/create-update-user', createOrUpdateUser);
router.post('/get-user-withaccess', getUserWithAccessById);
router.post('/get-user-with-mobile-password', getUserWithMobileAndPassword);

router.post('/update-password', changePasswordUsingMobile);

// Upload dress size PDF for a student

export default router;