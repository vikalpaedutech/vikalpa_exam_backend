const mongoose = require('mongoose');   //{connect}
const Student = require('../models/StudentModel');
const getNextSequence = require('../utils/mbl3Token.utils');

//Below API posts the data from the form body
const createPost = async (req, res) => {

    console.log(req.file);

    try {
        const post = new Student ({
            srn: req.body.srn,
            name: req.body.name,
            father: req.body.father,
            mother: req.body.mother,
            dob: req.body.dob,
            gender: req.body.gender,
            category: req.body.category,
            aadhar: req.body.aadhar,
            mobile: req.body.mobile,
            whatsapp: req.body.whatsapp,
            // address: req.body.address,
            //Added on 7 nov

            houseNumber: req.body.houseNumber,
            cityTownVillage: req.body.cityTownVillage,
            addressBlock: req.body.addressBlock,
            addressDistrict: req.body.addressDistrict,
            addressState: req.body.addressState,

            //^^^^^^^^^^^^^
            district: req.body.district,
            block: req.body.block,
            school: req.body.school,
            schoolCode: req.body.schoolCode,
            grade: req.body.grade,


            //added on 7 nov
            previousClassAnnualExamPercentage: req.body.previousClassAnnualExamPercentage,

            //^^^^^^^^^^^^^^^^^^^^^^^^^




            image: req.file ? req.file.originalname : null,
            imageUrl: req.body.imageUrl,
            isRegisteredBy: req.body.isRegisteredBy,
            isVerified: req.body.isVerified,
            isVerifiedBy: req.body.isVerifiedBy,
            slipId: req.body.slipId, //generatest the dynamic acknowledgement id for the students.
            rollNumber: req.body.rollNumber,
            examType: req.body.examType,
            centerAllocation1: req.body.centerAllocation1,
            centerAllocation2: req.body.centerAllocation2,
            centerAllocation3: req.body.centerAllocation3,
            dateL1: req.body.dateL1,
            dateL2: req.body.dateL2,
            dateL3: req.body.dateL3,
            admitCard1: req.body.admitCard1,
            admitCard2: req.body.admitCard2,
            admitCard3: req.body.admitCard3,
            resultStatus1: req.body.resultStatus1,
            resultStatus2: req.body.resultStatus2,
            resultStatus3: req.body.resultStatus3,
            marksL1: req.body.marksL1,
            marksL2: req.body.marksL2,
            marksL3: req.body.marksL3,
            isQualifiedL1: req.body.isQualifiedL1,
            isQualifiedL2: req.body.isQualifiedL2,
            isQualifiedL3: req.body.isQualifiedL3,
            verificationRemark: req.body.verificationRemark,
            verifiedBy: req.body.verifiedBy,
        });
        const postData = await post.save();

        res.status(200).send({success: true, msg: 'Data posted Successfully',data: postData});
        
    } catch (error) {
        res.status(400).send({success:false, msg:error.message});
    }
}

const getPosts = async(req, res)=>{
    try {
        const students = await Student.find({});
        res.status(200).send({success:true, msg: 'Posts Data', data:students});
        
    } catch (error) {
        res.status(400).send({success: false, msg: error.message});
    }
}
//_____________________________________________________________________________________________



//Below API is being used to get data from the students collection by srn. It is being used as updating data and in the prefilled form functionlity. 
// ... using this api we get the prefilled data in the form.

const getPostsBySrn = async (req, res) => {
    try {
        // Extract SRN from request parameters
        const { srn } = req.params;

        // Find a student with the specified SRN
        const student = await Student.findOne({ srn: srn });

        if (!student) {
            return res.status(404).send({ success: false, msg: 'Student not found' });
        }

        res.status(200).send({ success: true, msg: 'Posts Data', data: student });

    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};
//_____________________________________________________________________________________________________



// Below Api is being used in RegistrationDashComponent to test the data for deleting data from db.
//... Below api deletes the data on the basis of _id key in the db.

const deletePosts = async (req, res)=>{
    try {

        const id = req.params.id

        await Student.deleteOne({_id:id});
        res.status(200).send({success: true, msg: "Post deleted successfully"});

        
    } catch (error) {
        res.status(400).send({success: false, msg: error.message});
        
    }
}

//_______________________________________________________________________________________________



// Learnt and created below api. This api is supposed to update existing dta in db. In postman it is called PUT.
const updatePosts = async (req, res, next)=>{
    console.log(req.params.id);
    Student.findOneAndUpdate({_id:req.params.id}, {
        $set: {
            srn: req.body.srn,
            name: req.body.name,
            father: req.body.father,
            mother: req.body.mother,
            dob: req.body.dob,
            gender: req.body.gender,
            category: req.body.category,
            aadhar: req.body.aadhar,
            mobile: req.body.mobile,
            whatsapp: req.body.whatsapp,

            // address: req.body.address,
            //Added on 7 nov

            houseNumber: req.body.houseNumber,
            cityTownVillage: req.body.cityTownVillage,
            addressBlock: req.body.addressBlock,
            addressDistrict: req.body.addressDistrict,
            addressState: req.body.addressState,

            //^^^^^^^^^^^^^



            district: req.body.district,
            block: req.body.block,
            school: req.body.school,
            grade: req.body.grade,

                        //added on 7 nov
                        previousClassAnnualExamPercentage: req.body.previousClassAnnualExamPercentage,

                        //^^^^^^^^^^^^^^^^^^^^^^^^^

            image: req.file ? req.file.originalname : undefined,
            
            
        }
    })
    .then(result=>{
        res.status(200).json({
            updated_data: result
        })
    })
    .catch(error=>{
        console.log(error);
        res.status(500).json({
            error: error
        })
    })
}
//____________________________________________________________________________________________________


//PUT API
// Below API i learnt from many sources and finally created an PUT Api which updates the data on the matched srn in db. 
//... It has a short coming of, if the user wants to update his/her srn then he/she won't be able to...
//...because below api usese srn as the unique identifier for updating documents.
// now below api can update the data based on id.

const updatePostsById = async (req, res, next)=>{
    console.log(req.params.id);
    const id = req.params.id
    Student.findOneAndUpdate({_id:id}, {
        $set: {
            srn: req.body.srn,
            name: req.body.name,
            father: req.body.father,
            mother: req.body.mother,
            dob: req.body.dob,
            gender: req.body.gender,
            category: req.body.category,
            aadhar: req.body.aadhar,
            mobile: req.body.mobile,
            whatsapp: req.body.whatsapp,
            // address: req.body.address,
            //Added on 7 nov

            houseNumber: req.body.houseNumber,
            cityTownVillage: req.body.cityTownVillage,
            addressBlock: req.body.addressBlock,
            addressDistrict: req.body.addressDistrict,
            addressState: req.body.addressState,

            //^^^^^^^^^^^^^



            district: req.body.district,
            block: req.body.block,
            school: req.body.school,
            grade: req.body.grade,

                    //added on 7 nov
                    previousClassAnnualExamPercentage: req.body.previousClassAnnualExamPercentage,

                    //^^^^^^^^^^^^^^^^^^^^^^^^^


            
            image: req.file ? req.file.originalname : undefined,
            imageUrl:req.body.imageUrl,
            isRegisteredBy: req.body.isRegisteredBy,
            isVerified: req.body.isVerified,
            verifiedBy: req.body.verifiedBy,
            verificationRemark: req.body.verificationRemark,
            
            // verifiedBy: req.body.verifiedBy,


            
        }
    })
    .then(result=>{
        res.status(200).json({
            updated_data: result
        })
    })
    .catch(error=>{
        console.log(error);
        res.status(500).json({
            error: error
        })
    })


}

//Below is the patch api for verfiying student's data.

patchPostById = async (req, res) => {
    try {
        const id = req.params.id;

        // Find the document by ID
        const existingDocument = await Student.findById(id);
        
        if (!existingDocument) {
            return res.status(404).json({ message: "No Document found" });
        }

        // Prepare updated fields
        const updatedFields = {};

        if (req.body.verificationRemark !== undefined) {
            if (Array.isArray(req.body.verificationRemark)) {
                updatedFields.verificationRemark = req.body.verificationRemark.join(", ");
            } else {
                updatedFields.verificationRemark = req.body.verificationRemark;
            }
        }

        if (req.body.isVerified !== undefined) {
            updatedFields.isVerified = req.body.isVerified;
        }

        if (req.body.verifiedBy !== undefined) {
         updatedFields.verifiedBy = req.body.verifiedBy;
        }

        // Update the document
        const result = await Student.updateOne(
            { _id: id },
            { $set: updatedFields }
        );

        // Always respond with success if the document is found and updated
        res.status(200).json({
            message: "Student Updated Successfully",
            updatedFields
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error updating the document",
            error,
        });
    }
};

//Below api is the patch api for updating the student's admit card download status.

patchDownloadAdmitCardById = async (req, res) => {
    console.log('i am inside patch')
    try {
        const id = req.params.id;
        const { gradeForDynamicallyUpdatingResultStatusInDb } = req.body; // Access the values from req.body


        //find the document by id
        const existingDocument = await Student.findById(id);

        if (!existingDocument) {
            return res.status(404).json ({message: "No Document Found"});
        }

        console.log(gradeForDynamicallyUpdatingResultStatusInDb);
        console.log(id);

      
        //Update the document
        if (gradeForDynamicallyUpdatingResultStatusInDb === 8) {
            console.log('i am in a if block')
            const result = await Student.updateOne (
                {_id: id},
                
                {$set:{
                    
    
                    // admitCard3: req.body.admitCard3,

                    // admitCard3: true,

                    // resultStatus2: true

                    counsellingAdmitCardDownloaded: true
                }}
            );
        } else {
            console.log('i am in a else block')
            console.log(gradeForDynamicallyUpdatingResultStatusInDb)
            const result = await Student.updateOne (
                {_id: id},
                {$set:{
                    
    
                    //admitCard1: req.body.admitCard1,
                    //resultStatus1: true,
                    //admitCard2: true,
                    resultStatus2: true
                }}
            );

        }
        
        //Always respond with success if the document is found and updated

        res.status (200).json({
            message: "Admit Card or Certificate Download Succesfully",
            //data: req.body.admitCard1,
            data: req.body.resultStatus2,
        })

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Eroor downloading admit card",
            error,
        })
        
    }
}


//__________________________________________________________________________________________



patchAttendanceById = async (req, res) => {

    console.log('i am insdie controller')

    const {srn} = req.params;
        console.log(srn)
        const {  isPresentInL3Examination, isPresentInL2Examination, bedNo, roomNo } = req.body; // Access the values from req.body
            console.log("attendance status of mb is",isPresentInL3Examination);
            console.log("attendance status of s100 is",isPresentInL2Examination);
            console.log("bedNo and roomNo is", bedNo, roomNo);
            console.log(typeof(roomNo));
    try {
        

        //find the document by id
        const existingDocument = await Student.find({srn: srn});

        if (!existingDocument) {
            return res.status(404).json ({message: "No Document Found"});
        }

       
        console.log(srn);

      
        //Update the document
      
        if (isPresentInL3Examination !== undefined){


            const result = await Student.updateOne (
                {srn: srn},
                
                {$set:{
                    
    
                    // admitCard3: req.body.admitCard3,

                    isPresentInL3Examination: isPresentInL3Examination,
                    

                   
                }}
            );
        
        
        //Always respond with success if the document is found and updated

        res.status (200).json({
            message: "Attendance Updated Successfull",
            data: existingDocument,
        })






        } else if(isPresentInL2Examination !== undefined) {


            const result = await Student.updateOne (
                {srn: srn},
                
                {$set:{
                    
    
                    // admitCard3: req.body.admitCard3,

                    isPresentInL2Examination: isPresentInL2Examination,
                    roomNo: roomNo,
                    bedNo:bedNo,
                   
                }}
            );
        
        
        //Always respond with success if the document is found and updated

        res.status (200).json({
            message: "Attendance Updated Successfull",
            data: existingDocument,
        })







        }

            

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Eroor Updating Attendance",
            error,
        })
        
    }
}


//__________________________________________________________________________________________




// patchCounsellingBySrn = async (req, res) => {

//     console.log('i am insdie patchCounsellingBySrn controller')
//     const {selectedBoard, selectedSchool, homeToSchoolDistance, counsellingToken, counsellingToken1 } = req.body
//     const {srn, district} = req.params;
//         // console.log(srn)
//         console.log(counsellingToken)
//         console.log(counsellingToken1)
//         console.log(req.params)
       
//     try {
        

        

//         //find the document by id
//         const existingDocument = await Student.find({srn: srn, district: district});
        
//         if (existingDocument.length === 0) {
//             return res.status(404).json ({message: "No Document Found"});
//         } else if (existingDocument?.[0]?.counsellingAttendance === true){
//             return res.status(500).json ({status: "Falied", msg: "Attendance Already Marked"});
            
//         } 

//         let actualCounsellingToken;
//      if (existingDocument?.[0]?.finalShortListOrWaitListStudents === "Selected"){
//             actualCounsellingToken = counsellingToken
//         } else if (existingDocument?.[0]?.finalShortListOrWaitListStudents === "Waiting") {
//             actualCounsellingToken = counsellingToken1
//         }

//        console.log(existingDocument[0].finalShortListOrWaitListStudents)
//        console.log(existingDocument.length)
//        console.log(actualCounsellingToken)
    
//        // console.log(existingDocument);


        
//        //Update the document
      



//             const result = await Student.updateOne (
//                 {srn: srn},
                
//                 {$set:{
//                     counsellingAttendance:true,
//                     counsellingToken: actualCounsellingToken
//                 }

//                 }
//             );

//         //Always respond with success if the document is found and updated

//         res.status (200).json({
//             message: "Attendance Updated Successfull",
//             data: existingDocument,
//         })

//     } catch (error) {

//         console.error(error);

//         res.status(500).json({
//             message: "Eroor Updating Attendance",
//             error,
//         })
        
//     }
// }




patchCounsellingBySrn = async (req, res) => {
  console.log('Inside patchCounsellingBySrn controller');

  const { selectedBoard, selectedSchool, homeToSchoolDistance, counsellingToken, counsellingToken1 } = req.body;
  const { srn, district } = req.params;

  try {
    // Find the student document by SRN and district
    const existingDocument = await Student.find({ srn: srn, district: district });

    if (existingDocument.length === 0) {
      return res.status(404).json({ message: "No Document Found" });
    } else if (existingDocument?.[0]?.counsellingAttendance === true) {
      return res.status(500).json({ status: "Failed", msg: "Attendance Already Marked" });
    }

    // Get the class name (make sure this is the correct field in your schema)
    const className = existingDocument[0].L1districtAdmitCard;
    const selectionStatus = existingDocument[0].finalShortListOrWaitListStudents;
    // Replace with the actual field name
    const counterKey = `${selectionStatus}_${className}`; // Example: "counsellingToken_ClassA"
console.log("i am counterkey", counterKey)
    // Fetch the next available counselling token for this class

    const generatedToken = await getNextSequence(counterKey);

    let actualCounsellingToken;
    if (existingDocument?.[0]?.finalShortListOrWaitListStudents === "Selected") {
      actualCounsellingToken = counsellingToken;
    } else if (existingDocument?.[0]?.finalShortListOrWaitListStudents === "Waiting") {
      actualCounsellingToken = counsellingToken1;
    }

    let finalToken;
    if (selectionStatus === "Selected"){
        finalToken = 'S'+generatedToken
    } else if (selectionStatus === "Waiting") {
        finalToken = 'W'+generatedToken
    }

    // Update the student document with the counselling attendance and token
    const result = await Student.updateOne(
      { srn: srn },
      {
        $set: {
          counsellingAttendance: true,
          counsellingToken: finalToken,
        //   selectedBoard,
        //   selectedSchool,
        //   homeToSchoolDistance,
        }
      }
    );

    // Respond with success
    res.status(200).json({
      message: "Attendance Updated Successfully",
      tokenIssued: finalToken,
      data: existingDocument,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error Updating Attendance",
      error,
    });
  }
}


//__________________________________________________________________________________________

//Get Api. By Student SRN AND TOKEN NUMBER AND DISTRICT.

getStudentDataBySrnTokenDistrict = async (req, res) => {

    console.log("I am inside get student by by token srn and district")

    const {srn, counsellingToken, district} = req.query

    console.log(req.query)

    try {

        if (srn.length === 10){

            const response = await Student.find({
                srn: srn,
                district: district
            });
            res.status (200).json({
                message: "Data fetched successfully",
                data: response,
            })
            
        } else {

            const response = await Student.find({
                counsellingToken: counsellingToken,
                district: district
            });
            res.status (200).json({
                message: "Data fetched successfully",
                data: response,
            })

        }
        

       

    } catch (error) {
        
        
        console.error(error);

        res.status(500).json({
            message: "Eroor Fetching Data",
            error,
        })

    }

}






// patchCounsellingDocumentationBySrn = async (req, res) => {
//     console.log('Inside patchCounsellingDocumentationBySrn controller');

//     const { documents, selectedSchool, homeToSchoolDistance } = req.body; // Example: [1, 3, 5]
//     const { srn, district } = req.query;

//     console.log(req.body)
//     console.log(req.params)

//     // Map document numbers to field names  
//     const docMap = {
//         1: "twoPassportPhoto",
//         2: "aadharCardCopy",
//         3: "parentAadhar",
//         4: "ppp",
//         5: "slc"
//     };

//     try {
//         // Find the document by SRN and District
//         const student = await Student.findOne({ srn, district });

//         if (!student) {
//             return res.status(404).json({ message: "No Document Found" });
//         } 
        
//         // else if (student.counsellingAttendance === true) {
//         //     return res.status(400).json({ status: "Failed", msg: "Attendance Already Marked" });
//         // }

//         // Build new documents object with all fields defaulted to 0
//         const updatedDocs = {
//             twoPassportPhoto: 0,
//             aadharCardCopy: 0,
//             parentAadhar: 0,
//             ppp: 0,
//             slc: 0
//         };

//         // Set submitted documents to 1
//         documents.forEach(num => {
//             const key = docMap[num];
//             if (key) updatedDocs[key] = 1;
//         });

//         // Update the student document
//         const result = await Student.updateOne(
//             { srn, district },
//             {
//                 $set: {
//                     documents: updatedDocs,
//                     counsellingCenterAllocation:selectedSchool,
//                     homeToSchoolDistance:homeToSchoolDistance
//                 }
//             }
//         );

//         res.status(200).json({
//             message: "Documents updated successfully",
//             updatedDocs,
//         });

//     } catch (error) {
//         console.error("Error updating documents:", error);
//         res.status(500).json({
//             message: "Error updating documents",
//             error,
//         });
//     }
// };


//Documentation API...

patchCounsellingDocumentationBySrn = async (req, res) => {
    console.log('Inside patchCounsellingDocumentationBySrn controller');

    const { documents, selectedSchool, homeToSchoolDistance } = req.body; // Example: [1, 3, 5]
    const { srn, district } = req.query;

    console.log(req.body)
    console.log(req.params)

    // Map document numbers to field names  
    const docMap = {
        1: "twoPassportPhoto",
        2: "aadharCardCopy",
        3: "parentAadhar",
        4: "ppp",
        5: "slc"
    };

    try {
        // Find the document by SRN and District
        const student = await Student.findOne({ srn, district });

        if (!student) {
            return res.status(404).json({ message: "No Document Found" });
        } 
        
        // else if (student.counsellingAttendance === true) {
        //     return res.status(400).json({ status: "Failed", msg: "Attendance Already Marked" });
        // }

        // Build new documents object with all fields defaulted to 0
        const updatedDocs = {
            twoPassportPhoto: 0,
            aadharCardCopy: 0,
            parentAadhar: 0,
            ppp: 0,
            slc: 0
        };

        // Set submitted documents to 1
        documents.forEach(num => {
            const key = docMap[num];
            if (key) updatedDocs[key] = 1;
        });

        // Determine admissionStatus based on presence of document 5 (slc)
        const admissionStatus = documents.includes(5) ? "Enrolled" : "Provision";

        // Update the student document
        const result = await Student.updateOne(
            { srn, district },
            {
                $set: {
                    documents: updatedDocs,
                    counsellingCenterAllocation: selectedSchool,
                    homeToSchoolDistance: homeToSchoolDistance,
                    admissionStatus: admissionStatus,
                    selectedSchool:selectedSchool,
                }
            }
        );

        res.status(200).json({
            message: "Documents updated successfully",
            updatedDocs,
        });

    } catch (error) {
        console.error("Error updating documents:", error);
        res.status(500).json({
            message: "Error updating documents",
            error,
        });
    }
};

//------------------------------------------------------------







//Below is the way to export the module so that we can use it anywhere in our backend logics.

module.exports = {
    createPost,
    getPosts,
    deletePosts,
    updatePosts,
    updatePostsById,
    getPostsBySrn,
    patchPostById,
    patchDownloadAdmitCardById,
    patchAttendanceById,
    patchCounsellingBySrn,
    getStudentDataBySrnTokenDistrict,
    patchCounsellingDocumentationBySrn

}