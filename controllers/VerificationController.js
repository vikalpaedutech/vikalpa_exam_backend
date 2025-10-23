const mongoose = require('mongoose');
const VerificationRoute = require('../routes/VerificationRoute')
mongoose.connect("mongodb+srv://mbshbuhamshah:UReCN8RsIy3RDYJD@mvcbackend.arkoj.mongodb.net/Examination?retryWrites=true&w=majority&appName=mvcBackend");

//Below api is for fetching verification user data.

const VerificationSchema = new mongoose.Schema({
    name: String,
    userId: String, 
});


const Verification = mongoose.model('Verification', VerificationSchema)


const getVerificationUsers = async (req, res) => {
    try {

        const userId = req.params.userId;


        const verifications = await Verification.findOne({userId: userId});
        if (!verifications){
            return res.status(400).send({success:false, msg: 'User data not fetched!'})
        }

        res.status(200).send({success: true, msg: 'user fetched successfully', data:verifications});
    } catch (error) {
        res.status(400).send({success: false, msg: error.message});
    }
}


module.exports = {
    getVerificationUsers
}