const express = require('express');
const TwilioRoute = express();
const {sendNotification} = require('../controllers/TwilioController');

TwilioRoute.post('/send', sendNotification);

module.exports = TwilioRoute;