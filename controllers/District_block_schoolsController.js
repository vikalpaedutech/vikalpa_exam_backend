//Writing controllers, Business logic, res APIs for district.model.js.


import { District_Block_School } from "../models/District_block_schoolsModel.js";





export const createPost = async (req, res) => {
  console.log("I am inside District_Block_School controller, createPost API");

  try {
    const {
      districtId,
      districtName,
      blockId,
      blockName,
      centerId,
      centerName,
      schoolType
    } = req.body;

    console.log(req.body)

    const newEntry = await District_Block_School.create({
      districtId,
      districtName,
      blockId,
      blockName,
      centerId,
      centerName,
      schoolType
    });

    res.status(201).json({
      status: "Success",
      data: newEntry
    });

  } catch (error) {
    res.status(500).json({
      status: "Failed",
      message: error.message
    });
  }
};



//Get district_block_schools

export const GetDistrictBlockSchoolByParams = async (req, res) =>{

  //user ke role basis pr, dynamically centerId, blockId, districtId query krunga.




  const {districtId, blockId, centerId, role} = req.body;

console.log('Hello Region')

  

  try {
    

    const response = await District_Block_School.find({})

    res.status(200).json({status:"Success", data:response})


  } catch (error) {
    console.log('Error fetching data')
  }




}




//Update principal, abrc data


// export const updateAbrcPrincipal = async (req, res) => {
//   console.log("I am inside District_Block_School controller, updateAbrcPrincipal API");

//   try {
//     const { 
//       _id, 
//       isCluster, 
//       abrc, 
//       abrcContact, 
//       principal, 
//       princiaplContact ,
//       principalAbrcDataUpdatedBy
//     } = req.body;



//     console.log(req.body)



//     if (!_id) {
//       return res.status(400).json({
//         status: "Failed",
//         message: "Missing _id in request body"
//       });
//     }

//     console.log("Update Request Body:", req.body);

//     const updatedRecord = await District_Block_School.findByIdAndUpdate(
//       _id,
//       {
//         $set: {
//           isCluster,
//           abrc,
//           abrcContact,
//           principal,
//           princiaplContact,
//           principalAbrcDataUpdatedBy
//         }
//       },
//       { new: true }
//     );

//     if (!updatedRecord) {
//       return res.status(404).json({
//         status: "Failed",
//         message: "No record found with the given _id"
//       });
//     }

//     res.status(200).json({
//       status: "Success",
//       message: "Details updated successfully",
//       data: updatedRecord
//     });

//   } catch (error) {
//     console.error("Error in updateAbrcPrincipal:", error);
//     res.status(500).json({
//       status: "Failed",
//       message: error.message
//     });
//   }
// };







export const updateAbrcPrincipal = async (req, res) => {
  console.log("I am inside District_Block_School controller, updateAbrcPrincipal API");

  try {
    const {
      _id,
      isCluster,
      abrc,
      abrcContact,
      principal,
      princiaplContact,
      principalAbrcDataUpdatedBy,
      // support manual school creation:
      manualSchool // expected shape when creating: { districtId, districtName, blockId, blockName, centerId, centerName, schoolType? }
    } = req.body;

    console.log("Request body:", req.body);

    // If _id present => update existing record
    if (_id) {
      const updatedRecord = await District_Block_School.findByIdAndUpdate(
        _id,
        {
          $set: {
            // only update fields we care about
            isCluster,
            abrc,
            abrcContact,
            principal,
            princiaplContact,
            principalAbrcDataUpdatedBy
          }
        },
        { new: true }
      );

      if (!updatedRecord) {
        return res.status(404).json({
          status: "Failed",
          message: "No record found with the given _id"
        });
      }

      return res.status(200).json({
        status: "Success",
        message: "Details updated successfully",
        data: updatedRecord
      });
    }

    // If no _id, but manualSchool provided => create a new record (insert)
    if (! _id && manualSchool) {
      const {
        districtId,
        districtName,
        blockId,
        blockName,
        centerId,
        centerName,
        schoolType
      } = manualSchool;

      // basic validation
      if (!districtId || !blockId || !centerId || !centerName) {
        return res.status(400).json({
          status: "Failed",
          message: "manualSchool must include districtId, blockId, centerId and centerName"
        });
      }

      const newEntry = await District_Block_School.create({
        districtId,
        districtName: districtName || null,
        blockId,
        blockName: blockName || null,
        centerId,
        centerName,
        schoolType: schoolType || "Haryana School",
        // set provided fields
        isCluster: !!isCluster,
        abrc: abrc || null,
        abrcContact: abrcContact || null,
        principal: principal || null,
        princiaplContact: princiaplContact || null,
        principalAbrcDataUpdatedBy: principalAbrcDataUpdatedBy || null
      });

      return res.status(201).json({
        status: "Success",
        message: "Manual school created and data saved",
        data: newEntry,
        created: true
      });
    }

    // If neither _id nor manualSchool -> bad request
    return res.status(400).json({
      status: "Failed",
      message: "Missing _id or manualSchool payload in request body"
    });

  } catch (error) {
    console.error("Error in updateAbrcPrincipal:", error);
    res.status(500).json({
      status: "Failed",
      message: error.message
    });
  }
};






//Center-Prefefrence updation

export const updateSchoolCenterPreferences = async (req, res) => {
   try {
    // Get _id from request body (not params)
    const { centerPreference1, centerPreference2, _id,  centerPrefrenceFilledBy } = req.body;

    // Validate input - FIXED: Should check if !_id, not if _id
    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "School ID (_id) is required in request body"
      });
    }

    // Check if at least one preference is provided
    if (centerPreference1 === undefined && centerPreference2 === undefined) {
      return res.status(400).json({
        success: false,
        message: "At least one center preference is required"
      });
    }

    // Find the school by _id
    const school = await District_Block_School.findById(_id);
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found with the provided _id"
      });
    }

    // Validate preferences are not the same (only if both are provided and not empty/null)
    if (centerPreference1 && centerPreference2 && centerPreference1 === centerPreference2) {
      return res.status(400).json({
        success: false,
        message: "Center preferences cannot be the same"
      });
    }

    // Prepare update data
    const updateData = {centerPrefrenceFilledBy:centerPrefrenceFilledBy};
    
    if (centerPreference1 !== undefined) {
      updateData.centerPreference1 = centerPreference1 === "" ? null : centerPreference1;
    }
    
    if (centerPreference2 !== undefined) {
      updateData.centerPreference2 = centerPreference2 === "" ? null : centerPreference2;
    }

    // Update the school using _id from body
    const updatedSchool = await District_Block_School.findByIdAndUpdate(
      _id,  // Using _id from body
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Center preferences updated successfully",
      data: {
        _id: updatedSchool._id,
        centerId: updatedSchool.centerId,
        centerName: updatedSchool.centerName,
        districtName: updatedSchool.districtName,
        blockName: updatedSchool.blockName,
        centerPreference1: updatedSchool.centerPreference1,
        centerPreference2: updatedSchool.centerPreference2,
        updatedAt: updatedSchool.updatedAt
      }
    });

  } catch (error) {
    console.error("Error updating center preferences:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: Object.values(error.errors).map(err => err.message)
      });
    }

    // Handle CastError (invalid ID format)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid school ID format. _id must be a valid MongoDB ObjectId"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating center preferences",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};