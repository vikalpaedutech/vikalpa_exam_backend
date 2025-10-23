const express = require('express');
const DistrictBlockCentersRoute = express();



const DistrictBlockCentersController = require('../controllers/DistrictBlockCentersController');

DistrictBlockCentersRoute.get('/fetch-districtblockcenters', DistrictBlockCentersController.getDistrictBlockCenters);

module.exports = DistrictBlockCentersRoute;