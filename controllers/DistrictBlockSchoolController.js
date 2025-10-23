//This file contains the API To get or fetch the data from db.

const mongoose = require('mongoose');
const DistrictBlockSchoolRoute = require('../routes/DistrictBlockSchoolRoute');

mongoose.connect("mongodb+srv://mbshbuhamshah:UReCN8RsIy3RDYJD@mvcbackend.arkoj.mongodb.net/Examination?retryWrites=true&w=majority&appName=mvcBackend");



///----------------------------------------------------------------
//Below api is for fetching districts

const DistrictSchema = new mongoose.Schema({
    d_id: Number,
    d_name:String,
    
});

const District = mongoose.model('District', DistrictSchema)




const getDistricts = async (req, res) =>{
   try {

    const districts = await District.find({});
    res.status(200).send({success:true, msg: 'data fetched successfully', data:districts})
    
   } catch (error) {
    res.status(400).send({success: false, msg:error.message});
   }

}


//---------------------------------------------------
// Below api is fetching for block

const BlockSchema = new mongoose.Schema({
    d_id: Number,
    b_id: Number,
    b_name: String

});

const Block = mongoose.model('Block', BlockSchema);

const getBlocks = async (req, res)=>{
   try {
    
    const blocks = await Block.find({});
    res.status(200).send({success: true, msg: 'Blocks fetched successfully', data:blocks});

   } catch (error) {
    res.status(400).send({success:false, msg:error.message});
   };
};


//-----------------------------------------------------------------------------
// Creating Api for getting schools from db of collection blocks

const SchoolSchema = new mongoose.Schema({
    
        
        d_id: Number,
        b_id: Number,
        s_id: Number,
        s_name: String
      

});

const School = new mongoose.model('School', SchoolSchema);

const getSchools = async (req, res)=>{
    try {
        const schools = await School.find({});
        res.status(200).send({success: true, msg: 'Schools fetched successfully', data: schools})
    } catch (error) {
        res.status(400).send({success: false, msg: error.message});
    }
};

module.exports = {
    getDistricts,
    getBlocks,
    getSchools
}


