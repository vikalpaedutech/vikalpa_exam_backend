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