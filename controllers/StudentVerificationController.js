// controllers/studentController.js
import mongoose from "mongoose";
import { Student } from "../models/StudentModel.js"; // adjust path if needed

// Below api will be used to get students by verification users block id
export const GetStudentdsDataForVerification = async (req, res) => {
  try {
    const { schoolBlockCode, isRegisteredBy, isVerified, isBulkRegistered} = req.body;

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

    // Run query and return plain JS objects (.lean()) to avoid mongoose circulars
    const students = await Student.find(query)
      .lean()
      .exec();

    return res.status(200).json({ ok: true, data: students });
  } catch (error) {
    console.error("Error occured::::>", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      // optionally send error.message in dev only
    });
  }
};





//Patching student verification form

// export const UpdateStudentVerification = (req, res) =>{

// const {reqBody} = req.body;

// const _id = reqBody._id || null

// const query = {}

// if (reqBody.isVerified) query.reqBody.isVerified = reqBody.isVerified;
// if (reqBody.verifiedBy) query.reqBody.verifiedBy = reqBody.verifiedBy;
// if (reqBody.registrationFormVerificationRemark) query.reqBody.registrationFormVerificationRemark = reqBody.veriregistrationFormVerificationRemarkfiedBy;






// try {
//     const response = Student.findByIdAndUpdate({_id:id, ...query})

//     res.status(200).json({status:"ok", data:response});
// } catch (error) {
//     console.log("Error updating data:::", error)
// }


// }




// export const UpdateStudentVerification = async (req, res) => {
//   try {
//     const { _id, updates } = req.body || {};

//     if (!_id) {
//       return res.status(400).json({ ok: false, message: "_id is required in request body" });
//     }

//     if (!updates || typeof updates !== "object") {
//       return res.status(400).json({ ok: false, message: "updates object is required in request body" });
//     }

//     // Whitelist allowed updatable fields to avoid accidental/ malicious updates
//     const allowed = ["isVerified", "verifiedBy", "registrationFormVerificationRemark"];
//     const setObj = {};

//     allowed.forEach((field) => {
//       if (Object.prototype.hasOwnProperty.call(updates, field)) {
//         setObj[field] = updates[field];
//       }
//     });

//     if (Object.keys(setObj).length === 0) {
//       return res.status(400).json({ ok: false, message: "No allowed fields provided to update" });
//     }

//     // perform update and return the new document
//     const updated = await Student.findByIdAndUpdate(
//       _id,
//       { $set: setObj },
//       { new: true, runValidators: true }
//     ).lean();

//     if (!updated) {
//       return res.status(404).json({ ok: false, message: "Student not found" });
//     }

//     return res.status(200).json({ ok: true, data: updated });
//   } catch (err) {
//     console.error("UpdateStudentVerification error:", err);
//     return res.status(500).json({ ok: false, message: "Internal server error" });
//   }
// };





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














