const mongoose = require('mongoose');
const User = require('../models/UserModel');


//API for posting the user data in the mongodb collection
//...named users.

const PostUser = async (req, res) => {
    try {
        const Post = new User ({
            userName: req.body.userName,
            designation: req.body.designation,
            mobile: req.body.mobile,
            district: req.body.district,
            block: req.body.block,
            school: req.body.school,
            schoolCode: req.body.schoolCode,
            password: req.body.password
        });

        const PostData = await Post.save();

        res.status(200).send({success: true, msg: 'Data posted successfully', data: PostData});
        
    } catch (error) {
        res.status(400).send({success: false, msg: error.message});
    }
}
//------------------------------------------------------------------------------

//Below API is get API for getting user data on the basis of mobile. For login purpose

const GetUser = async (req, res)=>{
    try {
        const mobile = req.params.mobile;

        const users = await User.findOne({mobile: mobile});
        if(!users){
            return   res.status(400).send({success:false, msg:'User data not fetched!'})
        } 
         res.status(200).send({success:true, msg:'User data fetched successfully', data:users})
    } catch (error) {
        res.status(400).send({success: false, msg: error.message});
    }
}

module.exports = {
    PostUser,
    GetUser
}