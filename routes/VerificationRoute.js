const express = require('express');
const VerificationRoute = express();

const VerificationController = require('../controllers/VerificationController');


VerificationRoute.get('/get-verificationUsers/:userId',VerificationController.getVerificationUsers);


module.exports = VerificationRoute;