const express = require('express');
const UserRoute = express();
const bodyParser = require('body-parser')

const UserController = require('../controllers/UserController');
const multer = require('multer');
const upload = multer();




UserRoute.use(bodyParser.json());
UserRoute.use(bodyParser.urlencoded({extended:true}));

//Below will be all the routes...

UserRoute.post('/user', upload.none(), UserController.PostUser);
UserRoute.get('/userByMobile/:mobile', UserController.GetUser);




module.exports = UserRoute;