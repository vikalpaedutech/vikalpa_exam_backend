const mongoose = require('mongoose');
const PrincipalSchoolsAbrcDataCollection = require('../models/PrincipalSchoolAbrcDataCollection');


const CreateData = async (req, res) => {

    const {district,
    block,
    scholType,
    school,
    principal,
    principalContact,
    alternateSchoolNumber,
    abrcName,
    abrcAssignedSchools,
    abrcContact,
    abrcAlternateContact,
    dataType,
    dataFilledBy
} = req.body;

console.log(req.body)
    try {
        const Post = new PrincipalSchoolsAbrcDataCollection ({
            district:district,                                      
            block:block,
            scholType:scholType,
            school:school,
            principal:principal,
            principalContact:principalContact,
            alternateSchoolNumber:alternateSchoolNumber,
            abrcName:abrcName,
            abrcAssignedSchools:abrcAssignedSchools,
            abrcContact:abrcContact,
            abrcAlternateContact:abrcAlternateContact,
            dataType:dataType,
            dataFilledBy:dataFilledBy
        });

        const PostData = await Post.save();

        res.status(200).send({success: true, msg: 'Data posted successfully', data: PostData});
        
    } catch (error) {
        res.status(400).send({success: false, msg: error.message});
    }
}




module.exports = {
    CreateData,
  
}