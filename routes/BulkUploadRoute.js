const express = require('express');
const BulkUPloadRoute = express();
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const imageUrlMiddleware = require('../middleware/imageUrlMiddleware');
const BulkUploadController = require('../controllers/BulkUploadController');

const upload = multer();


BulkUPloadRoute.use(bodyParser.json());
BulkUPloadRoute.use(bodyParser.urlencoded({extended:true}));

BulkUPloadRoute.post('/bulkupload', upload.single('file'), BulkUploadController.BulkPost);

module.exports = BulkUPloadRoute;