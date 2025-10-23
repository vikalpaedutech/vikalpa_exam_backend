const express = require('express');
const DistrictBlockSchoolRoute = express();




const DistrictBlockSchoolController = require('../controllers/DistrictBlockSchoolController');


DistrictBlockSchoolRoute.get('/Fetch-districts', DistrictBlockSchoolController.getDistricts);
DistrictBlockSchoolRoute.get('/Fetch-blocks', DistrictBlockSchoolController.getBlocks);
DistrictBlockSchoolRoute.get('/Fetch-schools', DistrictBlockSchoolController.getSchools);

module.exports = DistrictBlockSchoolRoute;