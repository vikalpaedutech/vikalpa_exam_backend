// This file contains the API to get or fetch the data of examinationCenters from the db.

const mongoose = require('mongoose');

const DistrictBLockCentersRoute = require('../routes/DistrictBlockCentersRoute');

mongoose.connect("mongodb+srv://mbshbuhamshah:UReCN8RsIy3RDYJD@mvcbackend.arkoj.mongodb.net/Examination?retryWrites=true&w=majority&appName=mvcBackend");


//Below API is for fetching centers data from 'examinationcenters' collection

const DistrictBlockCentersSchema = new mongoose.Schema({
    district: String,
    d_id: String,
    blockName: String,
    b_id: String,
    L1examinationCenters: String,
});
const Examinationcenter = mongoose.model('Examinationcenter', DistrictBlockCentersSchema)

const getDistrictBlockCenters = async(req, res) => {
    try {
        
        const examinationcenters = await Examinationcenter.find({});
        res.status(200).send({success: true, msg: 'data fetched successfully', data:examinationcenters})

    } catch (error) {
        res.status(400).send({success: false, msg: error.message});
        
    }
}

module.exports = {
    getDistrictBlockCenters
}