const mongoose = require('mongoose');
const PrincipalSchoolsAbrcDataCollection = require('../models/PrincipalSchoolAbrcDataCollection');


const CreateData = async (req, res) => {

    const {
    district,
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








const GetData = async (req, res) => {

    const {
        district,
    dataFilledBy, dataType
} = req.body;

console.log(req.body)
    try {
       

        const response = await PrincipalSchoolsAbrcDataCollection.find({dataFilledBy:dataFilledBy, dataType:dataType});

        res.status(200).send({success: true, msg: 'Data fetched successfully', data: response});
        
    } catch (error) {
        res.status(400).send({success: false, msg: error.message});
    }
}










 const UpdateData = async (req, res) => {


  const {
    _id,
    district,
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
    dataFilledBy,
  } = req.body;

  console.log(req.body)
  try {
    // validate id
    if (!_id) {
      return res.status(400).send({ success: false, msg: "_id is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).send({ success: false, msg: "Invalid _id" });
    }

    // Build updates only for fields that are explicitly provided (not undefined)
    const allowedFields = {
      district,
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
      dataFilledBy,
    };

    const updates = {};
    Object.keys(allowedFields).forEach((key) => {
      const val = allowedFields[key];
      if (typeof val !== "undefined") updates[key] = val;
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).send({ success: false, msg: "No updatable fields provided" });
    }

    // Find by id and update, return the new document
    const updated = await PrincipalSchoolsAbrcDataCollection.findByIdAndUpdate(
      _id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).send({ success: false, msg: "Document not found" });
    }

    return res.status(200).send({ success: true, msg: "Data updated successfully", data: updated });
  } catch (error) {
    console.error("UpdateData error:", error);
    return res.status(500).send({ success: false, msg: error.message || "Server error" });
  }
};




module.exports = {
    CreateData,
  GetData,
  UpdateData
}





