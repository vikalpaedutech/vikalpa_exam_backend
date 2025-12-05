
// controllers/studentController.js
import mongoose from "mongoose";
import path from "path";
import multer from "multer";
import { Student } from "../models/StudentModel.js"; // adjust path if needed
import { uploadToDOStorage } from "../utils/digitalOceanSpaces.util.js"; // adjust path/filename if needed

// ------------------ MULTER SETUP ------------------
// memoryStorage so we can upload directly from buffer
const storage = multer.memoryStorage();

// file filter for images
const imageFileFilter = (req, file, cb) => {
  // accept common image mime types
  if (/^image\/(jpeg|jpg|png|webp|gif)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, webp, gif)."), false);
  }
};

// file filter for any single file (pdf/png/jpeg) - used for attendance/pdf if you want
const anyFileFilter = (req, file, cb) => {
  // Allow pdf and images
  if (/^(application\/pdf|image\/(jpeg|jpg|png|webp|gif))$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF or image files are allowed."), false);
  }
};

// limits
const limits = {
  fileSize: 5 * 1024 * 1024, // 5 MB file size limit (adjust as needed)
};

// Multer middlewares
export const uploadImage = multer({ storage, fileFilter: imageFileFilter, limits }).single("image");
// for your existing attendance/pdf usage (single 'file' field)
export const uploadAttendancePdfFile = multer({ storage, fileFilter: anyFileFilter, limits }).single("file");

// ------------------ CONTROLLER ------------------
/**
 * Create a new student record.
 * Accepts optional single image file in field name "image".
 * If image is present it will be uploaded to DO Spaces and imageUrl will be saved on the student.
 */


// export const createStudent = async (req, res) => {
//   try {
//     // Note: when using multer, req.body values are strings.
//     // If you need booleans/numbers convert them explicitly.

//     console.log("Hello api")

//     const data = req.body || {};

//     console.log(req.body)

//     // Minimal validation
//     if (!data.srn || !data.aadhar) {
//       return res.status(400).json({ message: "SRN and Aadhar are required fields." });
//     }

//     // Check for existing student with same SRN or Aadhar
//     const existing = await Student.findOne({
//       $or: [{ srn: data.srn } ],  //{ aadhar: data.aadhar }
//     });

//     if (existing) {
//       return res.status(409).json({ message: "Student with this SRN." });
//     }

//     // If an image file was uploaded (multer placed it on req.file), upload to DO Spaces
//     if (req.file && req.file.buffer) {
//       try {
//         // Build a safe filename: srn_timestamp_ext (fallback to Date.now if srn not present)
//         const ext = path.extname(req.file.originalname) || "";
//         const safeSrn = (data.srn || `unknown`).toString().replace(/\s+/g, "_");
//         const fileName = `${safeSrn}_${Date.now()}${ext}`;

//         // uploadToDOStorage(fileBuffer, fileName, mimeType)
//         const uploadedUrl = await uploadToDOStorage(req.file.buffer, fileName, req.file.mimetype);

//         // set imageUrl in data so it will be saved with student doc
//         data.imageUrl = uploadedUrl;
//         // optionally also set image field to filename or originalname
//         data.image = fileName;
//       } catch (uploadErr) {
//         console.error("Error uploading image to DO Spaces:", uploadErr);
//         return res.status(500).json({
//           success: false,
//           message: "Failed to upload image to storage.",
//           error: uploadErr.message,
//         });
//       }
//     }

//     // Create and save new student
//     const student = new Student(data);
//     await student.save();

//     return res.status(201).json({
//       success: true,
//       message: "Student created successfully.",
//       data:student,
//     });
//   } catch (error) {
//     console.error("Error creating student:", error);
//     // Handle mongoose unique index error (in-case of race condition)
//     if (error.code === 11000) {
//       const dupField = Object.keys(error.keyValue || {}).join(", ");
//       return res.status(409).json({
//         success: false,
//         message: `Duplicate field(s): ${dupField}.`,
//         error: error.message,
//       });
//     }
//     return res.status(500).json({
//       success: false,
//       message: "Server error while creating student.",
//       error: error.message,
//     });
//   }
// };





export const createStudent = async (req, res) => {
  try {
    // Note: when using multer, req.body values are strings.
    // If you need booleans/numbers convert them explicitly.

    console.log("Hello api")

    const data = req.body || {};

    console.log(req.body)

    // Minimal validation
    if (!data.srn || !data.aadhar) {
      return res.status(400).json({ message: "SRN and Aadhar are required fields." });
    }

    // Check for existing student with same SRN or Aadhar
    const existing = await Student.findOne({
      $or: [{ srn: data.srn } ],  //{ aadhar: data.aadhar }
    });

    if (req.file && req.file.buffer) {
      try {
        // Build a safe filename: srn_timestamp_ext (fallback to Date.now if srn not present)
        const ext = path.extname(req.file.originalname) || "";
        const safeSrn = (data.srn || `unknown`).toString().replace(/\s+/g, "_");
        const fileName = `${safeSrn}_${Date.now()}${ext}`;

        // uploadToDOStorage(fileBuffer, fileName, mimeType)
        const uploadedUrl = await uploadToDOStorage(req.file.buffer, fileName, req.file.mimetype);

        // set imageUrl in data so it will be saved with student doc
        data.imageUrl = uploadedUrl;
        // optionally also set image field to filename or originalname
        data.image = fileName;
      } catch (uploadErr) {
        console.error("Error uploading image to DO Spaces:", uploadErr);
        return res.status(500).json({
          success: false,
          message: "Failed to upload image to storage.",
          error: uploadErr.message,
        });
      }
    }

    // If an existing student with the SRN was found, update it instead of returning an error.
    if (existing) {
      try {
        // Copy fields from incoming data to the existing document but avoid overwriting immutable fields like _id.
        Object.keys(data).forEach((key) => {
          if (key === "_id") return;
          // If you want to avoid overwriting certain fields (createdAt, srn, etc.) adjust here.
          existing[key] = data[key];
        });

        // Save updated document
        const updated = await existing.save();

        return res.status(200).json({
          success: true,
          message: "Student updated successfully.",
          data: updated,
        });
      } catch (updateErr) {
        console.error("Error updating existing student:", updateErr);
        // Handle mongoose unique index error (in-case of race condition) during update
        if (updateErr.code === 11000) {
          const dupField = Object.keys(updateErr.keyValue || {}).join(", ");
          return res.status(409).json({
            success: false,
            message: `Duplicate field(s): ${dupField}.`,
            error: updateErr.message,
          });
        }
        return res.status(500).json({
          success: false,
          message: "Server error while updating student.",
          error: updateErr.message,
        });
      }
    }

    // Create and save new student
    const student = new Student(data);
    await student.save();

    return res.status(201).json({
      success: true,
      message: "Student created successfully.",
      data:student,
    });
  } catch (error) {
    console.error("Error creating student:", error);
    // Handle mongoose unique index error (in-case of race condition)
    if (error.code === 11000) {
      const dupField = Object.keys(error.keyValue || {}).join(", ");
      return res.status(409).json({
        success: false,
        message: `Duplicate field(s): ${dupField}.`,
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while creating student.",
      error: error.message,
    });
  }
};






//Patch api

export const updateStudent = async (req, res) => {

  console.log("Hello update api")
  try {
    const { _id:bodyId, ...updateData } = req.body;

     const _id = bodyId || req.query._id || req.params._id;

    console.log("Incoming req.body:", req.body);
    console.log("Incoming req.query:", req.query);
    console.log("Resolved _id:", _id);




    if (!_id) {
      return res.status(400).json({ message: "Student _id is required in request body." });
    }

    // Find student by _id
    const student = await Student.findById(_id);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // ----------- Handle image upload if file provided ------------
    if (req.file && req.file.buffer) {
      try {
        const ext = path.extname(req.file.originalname) || "";
        const safeSrn = (student.srn || "unknown").toString().replace(/\s+/g, "_");
        const fileName = `${safeSrn}_updated_${Date.now()}${ext}`;

        const uploadedUrl = await uploadToDOStorage(req.file.buffer, fileName, req.file.mimetype);

        // Update new image info
        updateData.image = fileName;
        updateData.imageUrl = uploadedUrl;
      } catch (uploadErr) {
        console.error("Error uploading updated image:", uploadErr);
        return res.status(500).json({
          success: false,
          message: "Failed to upload new image.",
          error: uploadErr.message,
        });
      }
    }

    // ----------- Perform Update ------------
    const updatedStudent = await Student.findByIdAndUpdate(_id, updateData, {
      new: true, // return updated document
      runValidators: true, // validate fields according to schema
    });

    return res.status(200).json({
      success: true,
      message: "Student updated successfully.",
      updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating student.",
      error: error.message,
    });
  }
};









//Student Signin api

// Get User + UserAccess by mobile and password

export const getStudentBySrnNumberOrSlipId = async (req, res) => {
  try {
    console.log("HELLO GET STUDENT");
    
    const { srn, slipId } = req.body;

    // Basic validation
    if (!srn && !slipId) {
      return res.status(400).json({
        ok: false,
        message: "Please provide either srn or slipId in request body",
      });
    }

    // Build dynamic query
    const query = {};
    if (srn) query.srn = srn;
    if (slipId) query.slipId = slipId;

    // Find student dynamically
    const studentDoc = await Student.findOne(query).lean();
    if (!studentDoc) {
      return res.status(404).json({
        ok: false,
        message: "Student not found with provided srn or slipId",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "student login successful",
      student: studentDoc,
    });
  } catch (err) {
    console.error("getStudentBySrnNumberOrSlipId error:", err);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};









//Updating students admit card download status in db


export const IsAdmitCardDownloaded = async (req, res) =>{

  console.log('hello admit card download status')
const {_id, admitCardDownloadStatus} = req.body
 
console.log(req.body)

  try {
    
    const response = await Student.findOneAndUpdate({_id:_id},  { $set: admitCardDownloadStatus }, { new: true })

     return res.status(200).json({
      ok: true,
      message: "Admit card stuatus updated successfully",
      data: response,
    });
  } catch (error) {
    console.log("Error occures while updating", error)
     return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: err.message,
    });
  }
}







//Patch aadhar

export const updateStudentAadhar = async (req, res) => {
  try {
    const { _id, aadhar, correctedBy } = req.body; // Get correctedBy from req.body
    
    console.log("Request body:", req.body);
    console.log("CorrectedBy from request:", correctedBy);
    
    // Validate required fields
    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required"
      });
    }

    if (!aadhar) {
      return res.status(400).json({
        success: false,
        message: "Aadhar number is required"
      });
    }

    // Validate correctedBy if provided
    if (!correctedBy) {
      console.warn("Warning: correctedBy is not provided in request body");
    }

    // Validate Aadhar format
    const aadharDigits = String(aadhar).replace(/\D/g, '');
    
    // Check if it's 12 digits
    if (aadharDigits.length !== 12) {
      return res.status(400).json({
        success: false,
        message: "Aadhar number must be exactly 12 digits"
      });
    }

    // Check if it contains only numbers
    if (!/^\d+$/.test(aadharDigits)) {
      return res.status(400).json({
        success: false,
        message: "Aadhar number must contain only digits"
      });
    }

    // Check if it's a valid aadhar (not all zeros, not starting with 0 or 1)
    if (aadharDigits === "000000000000") {
      return res.status(400).json({
        success: false,
        message: "Invalid Aadhar number"
      });
    }

    if (aadharDigits.startsWith('0') || aadharDigits.startsWith('1')) {
      return res.status(400).json({
        success: false,
        message: "Aadhar number cannot start with 0 or 1"
      });
    }

    // Check if student exists
    const existingStudent = await Student.findById(_id);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Check if aadhar is different from current
    const currentAadhar = existingStudent.aadhar || existingStudent.aadharNumber || existingStudent.aadhaar || "";
    const currentAadharDigits = String(currentAadhar).replace(/\D/g, '');
    
    if (aadharDigits === currentAadharDigits) {
      return res.status(400).json({
        success: false,
        message: "New Aadhar number is same as current Aadhar number"
      });
    }

    // Prepare update object
    const updateData = {
      aadhar: aadharDigits, // Update main aadhar field
      formCorrectionBy: correctedBy || null, // Use correctedBy from request body
      correctedFields: "aadhar",
      updatedAt: new Date()
    };

    console.log("Update data being sent to MongoDB:", updateData);

    // Update the student
    const updatedStudent = await Student.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(500).json({
        success: false,
        message: "Failed to update student record"
      });
    }

    console.log("Updated student from DB:", updatedStudent.toObject());

    // Format response
    const responseStudent = updatedStudent.toObject();
    
    // Remove sensitive fields if needed
    delete responseStudent.__v;
    
    // Ensure aadhar is returned as string, not scientific notation
    if (responseStudent.aadhar && typeof responseStudent.aadhar === 'number') {
      responseStudent.aadhar = responseStudent.aadhar.toString();
    }

    return res.status(200).json({
      success: true,
      message: "Aadhar number updated successfully",
      data: responseStudent
    });

  } catch (error) {
    console.error("❌ Error updating student Aadhar:", error);
    console.error("Error stack:", error.stack);
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID format"
      });
    }

    if (error.name === 'ValidationError') {
      console.error("Validation error details:", error.errors);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};