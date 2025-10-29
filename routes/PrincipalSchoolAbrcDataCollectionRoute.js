const express = require('express');
const PrincipalSchoolAbrcDataCollectionRoute = express();
const bodyParser = require('body-parser')

const UserController = require('../controllers/UserController');
const PrincipalSchoolAbrcDataCollectionController = require('../controllers/PrincipalSchoolAbrcDataCollectionController')
const multer = require('multer');
const upload = multer();




PrincipalSchoolAbrcDataCollectionRoute.use(bodyParser.json());
PrincipalSchoolAbrcDataCollectionRoute.use(bodyParser.urlencoded({extended:true}));




PrincipalSchoolAbrcDataCollectionRoute.post('/create-principal-abrc', PrincipalSchoolAbrcDataCollectionController.CreateData)
PrincipalSchoolAbrcDataCollectionRoute.post('/get-principal-abrc', PrincipalSchoolAbrcDataCollectionController.GetData)

PrincipalSchoolAbrcDataCollectionRoute.patch('/update-principal-abrc', PrincipalSchoolAbrcDataCollectionController.UpdateData)

module.exports = PrincipalSchoolAbrcDataCollectionRoute;