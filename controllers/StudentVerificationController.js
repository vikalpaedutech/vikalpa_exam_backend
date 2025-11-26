// controllers/studentController.js
import mongoose from "mongoose";
import { Student } from "../models/StudentModel.js"; // adjust path if needed
import { District_Block_School } from "../models/District_block_schoolsModel.js";
import { User } from "../models/UserModel.js";

// Below api will be used to get students by verification users block id
// export const GetStudentdsDataForVerification = async (req, res) => {
//   try {
//     const { schoolBlockCode, isRegisteredBy, isVerified, isBulkRegistered} = req.body;

//     const query = {}

//     if (schoolBlockCode) query.schoolBlockCode = schoolBlockCode;
//     if (isRegisteredBy) query.isRegisteredBy = isRegisteredBy;
//     if (isVerified) query.isVerified = isVerified;
//     if (isBulkRegistered) query.isBulkRegistered = isBulkRegistered;

//      console.log(query)

//     // Basic validation
//     if (!Array.isArray(schoolBlockCode) || schoolBlockCode.length === 0) {
//       return res.status(400).json({
//         ok: false,
//         message: "blockIds must be a non-empty array in request body",
//       });
//     }

//     // Run query and return plain JS objects (.lean()) to avoid mongoose circulars
//     const students = await Student.find(query)
//       .lean()
//       .exec();

//     return res.status(200).json({ ok: true, data: students });
//   } catch (error) {
//     console.error("Error occured::::>", error);
//     return res.status(500).json({
//       ok: false,
//       message: "Internal server error",
//       // optionally send error.message in dev only
//     });
//   }
// };




// // Below api will be used to get students by verification users block id
// export const GetStudentdsDataForVerification = async (req, res) => {
//   try {
//     const { schoolBlockCode, isRegisteredBy, isVerified, isBulkRegistered } = req.body;

//     const query = {}

//     if (schoolBlockCode) query.schoolBlockCode = schoolBlockCode;
//     if (isRegisteredBy) query.isRegisteredBy = isRegisteredBy;
//     if (isVerified) query.isVerified = isVerified;
//     if (isBulkRegistered) query.isBulkRegistered = isBulkRegistered;

//      console.log(query)

//     // Basic validation
//     if (!Array.isArray(schoolBlockCode) || schoolBlockCode.length === 0) {
//       return res.status(400).json({
//         ok: false,
//         message: "blockIds must be a non-empty array in request body",
//       });
//     }

//     // Run query and return plain JS objects (.lean()) to avoid mongoose circulars
//     // Added .limit(100) to fetch only 100 rows each time
//     const students = await Student.find(query)
//       .limit(100)
//       .lean()
//       .exec();

//     return res.status(200).json({ ok: true, data: students });
//   } catch (error) {
//     console.error("Error occured::::>", error);
//     return res.status(500).json({
//       ok: false,
//       message: "Internal server error",
//       // optionally send error.message in dev only
//     });
//   }
// };




// export const GetStudentdsDataForVerification = async (req, res) => {
//   try {
//     const { schoolBlockCode, isRegisteredBy, isVerified, isBulkRegistered } = req.body;

//     const query = {}

//     if (schoolBlockCode) query.schoolBlockCode = schoolBlockCode;
//     if (isRegisteredBy) query.isRegisteredBy = isRegisteredBy;
//     if (isVerified) query.isVerified = isVerified;
//     if (isBulkRegistered) query.isBulkRegistered = isBulkRegistered;

//      console.log(query)

//     // Basic validation
//     if (!Array.isArray(schoolBlockCode) || schoolBlockCode.length === 0) {
//       return res.status(400).json({
//         ok: false,
//         message: "blockIds must be a non-empty array in request body",
//       });
//     }

//     // Get total count of students matching the query
//     const totalCount = await Student.countDocuments(query);

//     // Run query and return plain JS objects (.lean()) to avoid mongoose circulars
//     // Added .limit(100) to fetch only 100 rows each time
//     const students = await Student.find(query)
//       .limit(100)
//       .lean()
//       .exec();

//     return res.status(200).json({ 
//       ok: true, 
//       data: students,
//       totalCount: totalCount // Added total count
//     });
//   } catch (error) {
//     console.error("Error occured::::>", error);
//     return res.status(500).json({
//       ok: false,
//       message: "Internal server error",
//       // optionally send error.message in dev only
//     });
//   }
// };









export const GetStudentdsDataForVerification = async (req, res) => {
  try {
    const { schoolBlockCode, isRegisteredBy, isVerified, isBulkRegistered, page = 1, limit = 100 } = req.body;

    const query = {}

    if (schoolBlockCode) query.schoolBlockCode = schoolBlockCode;
    if (isRegisteredBy) query.isRegisteredBy = isRegisteredBy;
    if (isVerified) query.isVerified = isVerified;
    if (isBulkRegistered) query.isBulkRegistered = isBulkRegistered;

     console.log(query)

    // Basic validation
    if (!Array.isArray(schoolBlockCode) || schoolBlockCode.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "blockIds must be a non-empty array in request body",
      });
    }

    // Get total count of students matching the query
    const totalCount = await Student.countDocuments(query);

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const totalPages = Math.ceil(totalCount / limitNum);

    // Run query and return plain JS objects (.lean()) to avoid mongoose circulars
    const students = await Student.find(query)
      .skip(skip)
      .limit(limitNum)
      .lean()
      .exec();

    return res.status(200).json({ 
      ok: true, 
      data: students,
      totalCount: totalCount,
      currentPage: pageNum,
      totalPages: totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    });
  } catch (error) {
    console.error("Error occured::::>", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      // optionally send error.message in dev only
    });
  }
};















export const BulkUploadVerification = async (req, res) => {
  // const {schoolDistrictCode} = req.body;


  console.log(req.body)
  const schoolDistrictCode = ["83", "77"];

  try {
    const response = await Student.aggregate([
      {
        $match: {
          isBulkRegistered: true,
          schoolCode: { $in: schoolDistrictCode }
        }
      },
      {
        $group: {
          _id: "$schoolCode",
          TotalRegistration8: {
            $sum: {
              $cond: [{ $eq: ["$classOfStudent", "8"] }, 1, 0]
            }
          },
          TotalRegistration10: {
            $sum: {
              $cond: [{ $eq: ["$classOfStudent", "10"] }, 1, 0]
            }
          },
          // Get the first student document to extract school details
          firstStudent: { $first: "$$ROOT" },
          // Get all unique isRegisteredBy IDs for this school
          registeredByIds: { $addToSet: "$isRegisteredBy" }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: "registeredByIds",
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: {
          path: '$userInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          // Principal info from users collection
          principal: "$userInfo.userName",
          principalContact: "$userInfo.mobile",
          // School details from the first student document
          schoolCode: "$_id",
          districtName: "$firstStudent.schoolDistrict",
          districtId: "$firstStudent.schoolDistrictCode",
          blockId: "$firstStudent.schoolBlockCode", 
          blockName: "$firstStudent.schoolBlock",
          centerId: "$firstStudent.schoolCode",
          centerName: "$firstStudent.school",
          // Registration counts
          TotalRegistration8: 1,
          TotalRegistration10: 1
        }
      }
    ]);

    res.status(200).json({ status: "Ok", data: response });

  } catch (error) {
    console.error("Error::::", error);
    res.status(500).json({ status: "Error", message: error.message });
  }
}





export const UpdateStudentVerification = async (req, res) => {
  try {
    const { _id, updates } = req.body || {};

    if (!_id) {
      return res.status(400).json({ ok: false, message: "_id is required in request body" });
    }
    if (!updates || typeof updates !== "object") {
      return res.status(400).json({ ok: false, message: "updates object is required in request body" });
    }

    const allowed = ["isVerified", "verifiedBy", "registrationFormVerificationRemark"];
    const setObj = {};

    allowed.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        if (field === "registrationFormVerificationRemark") {
          const val = updates[field];
          if (Array.isArray(val)) {
            setObj[field] = val.join("; "); // convert array to string
          } else if (val === null) {
            setObj[field] = null;
          } else {
            setObj[field] = String(val);
          }
        } else {
          setObj[field] = updates[field];
        }
      }
    });

    if (Object.keys(setObj).length === 0) {
      return res.status(400).json({ ok: false, message: "No allowed fields provided to update" });
    }

    const updated = await Student.findByIdAndUpdate(
      _id,
      { $set: setObj },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ ok: false, message: "Student not found" });
    }

    return res.status(200).json({ ok: true, data: updated });
  } catch (err) {
    console.error("UpdateStudentVerification error:", err);
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
};














