
// controllers/studentController.js
import mongoose from "mongoose";
import path from "path";
import multer from "multer";
import { Student } from "../models/StudentModel.js"; // adjust path if needed
import { uploadToDOStorage } from "../utils/digitalOceanSpaces.util.js"; // adjust path/filename if needed
import { arrayBuffer } from "stream/consumers";

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

//Patch api can be used


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


//Dummy code block below

const dummyTestFunction = () =>{

try {
  console.log('This is the function that renders the console log')
} catch (error) {
  console.log("This is the function that ")
}


}



//----------------------------------






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








export const GetAttendanceSheetData = async(req, res) =>{

  const {counsellingVenue} = req.body

  console.log('I am insisde Student Controller at line 594')
  console.log('helloo')
  console.log(req.body)

  //for class wise separation
  const classOfStudent = "8"

  try {
    const response = await Student.find({counsellingVenue:counsellingVenue, classOfStudent:classOfStudent})
 
    return res.status(200).json({
      ok: true,
      message: "Data fetched successfully!",
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





export const GetAttendanceSheetDataS100 = async(req, res) =>{

  const {L2ExaminationCenter, batchDivisionForL2Examination, selectionStatusForL2, gender} = req.body

  console.log('I am insisde Student Controller at line 594')
  console.log('helloo')
  console.log(req.body)


  let genderArray = []

  if (req.body.gender === 'BOTH'){
    genderArray = ["MALE", "FEMALE"]
  } else {
    genderArray.push(req.body.gender)
  }

  console.log(genderArray)

  //for class wise separation
  const classOfStudent = "8"

  try {
    const response = await Student.find({L2ExaminationCenter:L2ExaminationCenter,
       batchDivisionForL2Examination:batchDivisionForL2Examination, selectionStatusForL2:selectionStatusForL2,
      gender:{$in:genderArray}})
 
    return res.status(200).json({
      ok: true,
      message: "Data fetched successfully!",
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



//For counselling




export const GetAttendanceSheetDataCounselling = async(req, res) =>{

  const {counsellingVenue, selectionStatusForL3, gender, srn} = req.body

  console.log('I am insisde Student Controller at line 677')
  console.log('helloo')
  console.log(req.body)




  //for class wise separation
  const classOfStudent = "8"

  try {
    const response = await Student.find({srn:srn})
 
    return res.status(200).json({
      ok: true,
      message: "Data fetched successfully!",
      data: response,
    });
    console.log(response.data)
  } catch (error) {
    console.log("Error occures while updating", error)
     return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: err.message,
    });
  }
}









export const updateCounsellingFields = async (req, res) => {
  try {
    const { _id } = req.body;

    console.log('update status counselling')
    
    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "_id to bhej de bhai"
      });
    }

    const {
      centerPreference1,
      centerPreference2,
      homeToCp1Distance,
      homeToCp2Distance,
      student3PassportSizedPhoto,
      studentAadharCardPhotoCopuy,
      parentsAaadhar,
      preCounsellingForm,
      class8MarksheetPhotoCopy,
      pppPhotocopy,
      slc,
      finalAdmissionStatus,
      counsellingAttendance
    } = req.body;

    // Sirf wahi fields update karo jo req.body mein aaye hain
    const updateFields = {};
    
    if (centerPreference1 !== undefined) updateFields.centerPreference1 = centerPreference1;
    if (centerPreference2 !== undefined) updateFields.centerPreference2 = centerPreference2;
    if (homeToCp1Distance !== undefined) updateFields.homeToCp1Distance = homeToCp1Distance;
    if (homeToCp2Distance !== undefined) updateFields.homeToCp2Distance = homeToCp2Distance;
    if (student3PassportSizedPhoto !== undefined) updateFields.student3PassportSizedPhoto = student3PassportSizedPhoto;
    if (studentAadharCardPhotoCopuy !== undefined) updateFields.studentAadharCardPhotoCopuy = studentAadharCardPhotoCopuy;
    if (parentsAaadhar !== undefined) updateFields.parentsAaadhar = parentsAaadhar;
    if (preCounsellingForm !== undefined) updateFields.preCounsellingForm = preCounsellingForm;
    if (class8MarksheetPhotoCopy !== undefined) updateFields.class8MarksheetPhotoCopy = class8MarksheetPhotoCopy;
    if (pppPhotocopy !== undefined) updateFields.pppPhotocopy = pppPhotocopy;
    if (slc !== undefined) updateFields.slc = slc;
    if (finalAdmissionStatus !== undefined) updateFields.finalAdmissionStatus = finalAdmissionStatus;
    if (counsellingAttendance !== undefined) updateFields.counsellingAttendance = counsellingAttendance;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Koi field update karne ko nahi mila"
      });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      _id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student nahi mila"
      });
    }

    res.status(200).json({
      success: true,
      message: "Update ho gaya",
      data: updatedStudent
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};






//Marking counselling attendance and generating token using "Database Atomic Operations".

// Import TokenCounter model (create this model first)
const TokenCounterSchema = new mongoose.Schema({
  counsellingVenue: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  currentToken: { type: Number, default: 0 }
});

// Create compound unique index
TokenCounterSchema.index({ counsellingVenue: 1, date: 1 }, { unique: true });
const TokenCounter = mongoose.model('TokenCounter', TokenCounterSchema);

// Main Controller Function
export const MarkCounsellingAttendance = async (req, res) => {
  const { studentId, counsellingVenue, attendanceStatus } = req.body;

  console.log(req.body)
  // Validation
  if (!studentId || !counsellingVenue) {
    return res.status(400).json({
      ok: false,
      message: "Student ID and Counselling Venue are required"
    });
  }

  if (typeof attendanceStatus !== 'boolean') {
    return res.status(400).json({
      ok: false,
      message: "Attendance status must be a boolean value"
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    let tokenNumber = 0;

    // If marking as PRESENT, generate new token
    if (attendanceStatus === true) {
      // ATOMIC OPERATION: Get next token number
      const counter = await TokenCounter.findOneAndUpdate(
        { 
          counsellingVenue: counsellingVenue,
          date: currentDate 
        },
        { $inc: { currentToken: 1 } },
        { 
          upsert: true, 
          new: true,
          session 
        }
      );
      
      tokenNumber = counter.currentToken;
    }

    // Update student attendance and token
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      {
        counsellingAttendance: attendanceStatus,
        counsellingTokenNumber: tokenNumber,
        counsellingVenue: counsellingVenue,
        counsellingDate: new Date(),
        updatedAt: new Date()
      },
      { 
        new: true,
        session,
        runValidators: false // Skip validation for optional fields
      }
    );

    if (!updatedStudent) {
      throw new Error("Student not found");
    }

    await session.commitTransaction();

    return res.status(200).json({
      ok: true,
      message: attendanceStatus ? "Attendance marked successfully" : "Attendance removed successfully",
      data: {
        student: {
          _id: updatedStudent._id,
          name: updatedStudent.name,
          srn: updatedStudent.srn,
          counsellingAttendance: updatedStudent.counsellingAttendance,
          counsellingTokenNumber: updatedStudent.counsellingTokenNumber,
          counsellingVenue: updatedStudent.counsellingVenue
        },
        tokenNumber: tokenNumber,
        venue: counsellingVenue,
        date: currentDate
      }
    });

  } catch (error) {
    await session.abortSession();
    console.error("Error marking attendance:", error);
    
    return res.status(500).json({
      ok: false,
      message: "Failed to mark attendance",
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Optional: Get token status for a venue
export const GetTokenStatus = async (req, res) => {
  const { counsellingVenue } = req.params;
  const currentDate = new Date().toISOString().split('T')[0];

  try {
    const counter = await TokenCounter.findOne({
      counsellingVenue: counsellingVenue,
      date: currentDate
    });

    return res.status(200).json({
      ok: true,
      data: {
        venue: counsellingVenue,
        date: currentDate,
        lastTokenIssued: counter ? counter.currentToken : 0,
        nextToken: counter ? counter.currentToken + 1 : 1
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch token status",
      error: error.message
    });
  }
};

// Optional: Get all students attendance for a venue
export const GetVenueAttendance = async (req, res) => {
  const { counsellingVenue } = req.params;
  const currentDate = new Date().toISOString().split('T')[0];

  try {
    const students = await Student.find({
      counsellingVenue: counsellingVenue,
      counsellingDate: {
        $gte: new Date(currentDate),
        $lt: new Date(new Date(currentDate).setDate(new Date(currentDate).getDate() + 1))
      }
    }).select('name srn father counsellingAttendance counsellingTokenNumber counsellingVenue');

    return res.status(200).json({
      ok: true,
      data: students,
      totalPresent: students.filter(s => s.counsellingAttendance === true).length,
      totalStudents: students.length
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch venue attendance",
      error: error.message
    });
  }
};






export const updateCenterPreference = async (req, res) => {
  const { 
    _id, 
    centerPreference1, 
    centerPreference2, 
    homeToCp1Distance, 
    homeToCp2Distance 
  } = req.body;

console.log(req.body)

  try {
    // Validate required fields
    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required"
      });
    }

    // Prepare update object
    const updateData = {};
    
    if (centerPreference1) {
      updateData.centerPreference1 = centerPreference1;
    }
    if (centerPreference2) {
      updateData.centerPreference2 = centerPreference2;
    }
    if (homeToCp1Distance !== undefined && homeToCp1Distance !== null) {
      updateData.homeToCp1Distance = Number(homeToCp1Distance);
    }
    if (homeToCp2Distance !== undefined && homeToCp2Distance !== null) {
      updateData.homeToCp2Distance = Number(homeToCp2Distance);
    }

    // Add updated timestamp
    updateData.updatedAt = new Date();

    // Update student record
    const updatedStudent = await Student.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Center preferences updated successfully",
      data: updatedStudent
    });

  } catch (error) {
    console.error("Error updating center preferences:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};





// In your backend controller file
export const updateDocumentVerification = async (req, res) => {
  const { 
    _id, 
    documents,
    finalAdmissionStatus 
  } = req.body;





  console.log("Update Document Verification Request:", req.body);

  try {
    // Validate required fields
    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required"
      });
    }

    // Prepare update object
    const updateData = {};
    
    // Update document fields if provided
    if (documents) {
      if (documents.student3PassportSizedPhoto !== undefined) {
        updateData.student3PassportSizedPhoto = documents.student3PassportSizedPhoto;
      }
      if (documents.studentAadharCardPhotoCopuy !== undefined) {
        updateData.studentAadharCardPhotoCopuy = documents.studentAadharCardPhotoCopuy;
      }
      if (documents.parentsAaadhar !== undefined) {
        updateData.parentsAaadhar = documents.parentsAaadhar;
      }
      if (documents.preCounsellingForm !== undefined) {
        updateData.preCounsellingForm = documents.preCounsellingForm;
      }
      if (documents.class8MarksheetPhotoCopy !== undefined) {
        updateData.class8MarksheetPhotoCopy = documents.class8MarksheetPhotoCopy;
      }
      if (documents.pppPhotocopy !== undefined) {
        updateData.pppPhotocopy = documents.pppPhotocopy;
      }
      if (documents.slc !== undefined) {
        updateData.slc = documents.slc;
      }
    }

    // Update final admission status if provided
    if (finalAdmissionStatus) {
      updateData.finalAdmissionStatus = finalAdmissionStatus;
    }

    // Add updated timestamp
    updateData.updatedAt = new Date();

    // Update student record
    const updatedStudent = await Student.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Document verification updated successfully",
      data: updatedStudent
    });

  } catch (error) {
    console.error("Error updating document verification:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};






//Dashboard for counselling



// export const getCenterPreferenceDashboard = async (req, res) => {
//   try {
//     const result = await Student.aggregate([
//       {
//         $match: {
//           isPresentInL3Examination: true,
//           selectionStatusForL3: { $in: ["Selected", "Waiting"] }
//         }
//       },

//       {
//         $facet: {
//           preference1: [
//             {
//               $group: {
//                 _id: {
//                   center: "$centerPreference1",
//                   status: "$selectionStatusForL3"
//                 },
//                 count: { $sum: 1 }
//               }
//             }
//           ],
//           preference2: [
//             {
//               $group: {
//                 _id: {
//                   center: "$centerPreference2",
//                   status: "$selectionStatusForL3"
//                 },
//                 count: { $sum: 1 }
//               }
//             }
//           ]
//         }
//       }
//     ]);

//     res.status(200).json({
//       success: true,
//       data: result[0]
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Server Error"
//     });
//   }
// };




export const getCenterPreferenceDashboard = async (req, res) => {
  try {
    const result = await Student.aggregate([
      {
        $match: {
          isPresentInL3Examination: true,
          selectionStatusForL3: { $in: ["Selected", "Waiting"] }
        }
      },

      {
        $facet: {
          preference1: [
            {
              $group: {
                _id: {
                  center: "$centerPreference1",
                  status: "$selectionStatusForL3",
                  admissionStatus: "$finalAdmissionStatus"
                },
                count: { $sum: 1 }
              }
            },
            {
              $group: {
                _id: {
                  center: "$_id.center",
                  status: "$_id.status"
                },
                totalCount: { $sum: "$count" },
                admissionStatusBreakdown: {
                  $push: {
                    admissionStatus: "$_id.admissionStatus",
                    count: "$count"
                  }
                }
              }
            },
            {
              $project: {
                center: "$_id.center",
                status: "$_id.status",
                totalCount: 1,
                admissionStatusBreakdown: {
                  $filter: {
                    input: "$admissionStatusBreakdown",
                    as: "item",
                    cond: { $ne: ["$$item.admissionStatus", null] }
                  }
                }
              }
            },
            {
              $group: {
                _id: "$center",
                statuses: {
                  $push: {
                    status: "$status",
                    totalCount: "$totalCount",
                    admissionStatusBreakdown: "$admissionStatusBreakdown"
                  }
                }
              }
            },
            {
              $project: {
                center: "$_id",
                selected: {
                  $let: {
                    vars: {
                      selectedData: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$statuses",
                              as: "s",
                              cond: { $eq: ["$$s.status", "Selected"] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: {
                      totalCount: { $ifNull: ["$$selectedData.totalCount", 0] },
                      breakdown: {
                        $ifNull: ["$$selectedData.admissionStatusBreakdown", []]
                      }
                    }
                  }
                },
                waiting: {
                  $let: {
                    vars: {
                      waitingData: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$statuses",
                              as: "s",
                              cond: { $eq: ["$$s.status", "Waiting"] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: {
                      totalCount: { $ifNull: ["$$waitingData.totalCount", 0] }
                    }
                  }
                }
              }
            },
            {
              $match: {
                $or: [
                  { "selected.totalCount": { $gt: 0 } },
                  { "waiting.totalCount": { $gt: 0 } }
                ]
              }
            },
            {
              $sort: { center: 1 }
            }
          ],
          
          preference2: [
            {
              $group: {
                _id: {
                  center: "$centerPreference2",
                  status: "$selectionStatusForL3",
                  admissionStatus: "$finalAdmissionStatus"
                },
                count: { $sum: 1 }
              }
            },
            {
              $group: {
                _id: {
                  center: "$_id.center",
                  status: "$_id.status"
                },
                totalCount: { $sum: "$count" },
                admissionStatusBreakdown: {
                  $push: {
                    admissionStatus: "$_id.admissionStatus",
                    count: "$count"
                  }
                }
              }
            },
            {
              $project: {
                center: "$_id.center",
                status: "$_id.status",
                totalCount: 1,
                admissionStatusBreakdown: {
                  $filter: {
                    input: "$admissionStatusBreakdown",
                    as: "item",
                    cond: { $ne: ["$$item.admissionStatus", null] }
                  }
                }
              }
            },
            {
              $group: {
                _id: "$center",
                statuses: {
                  $push: {
                    status: "$status",
                    totalCount: "$totalCount",
                    admissionStatusBreakdown: "$admissionStatusBreakdown"
                  }
                }
              }
            },
            {
              $project: {
                center: "$_id",
                selected: {
                  $let: {
                    vars: {
                      selectedData: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$statuses",
                              as: "s",
                              cond: { $eq: ["$$s.status", "Selected"] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: {
                      totalCount: { $ifNull: ["$$selectedData.totalCount", 0] },
                      breakdown: {
                        $ifNull: ["$$selectedData.admissionStatusBreakdown", []]
                      }
                    }
                  }
                },
                waiting: {
                  $let: {
                    vars: {
                      waitingData: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$statuses",
                              as: "s",
                              cond: { $eq: ["$$s.status", "Waiting"] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: {
                      totalCount: { $ifNull: ["$$waitingData.totalCount", 0] }
                    }
                  }
                }
              }
            },
            {
              $match: {
                $or: [
                  { "selected.totalCount": { $gt: 0 } },
                  { "waiting.totalCount": { $gt: 0 } }
                ]
              }
            },
            {
              $sort: { center: 1 }
            }
          ]
        }
      }
    ]);

    // Transform the data to a more readable format
    const transformedData = {
      preference1: result[0].preference1.map(item => ({
        center: item.center,
        selected: {
          total: item.selected.totalCount,
          admissionDone: item.selected.breakdown.find(b => b.admissionStatus === "Admission Done")?.count || 0,
          provisional: item.selected.breakdown.find(b => b.admissionStatus === "Provisional")?.count || 0,
          waiting: item.selected.breakdown.find(b => b.admissionStatus === "Waiting")?.count || 0
        },
        waiting: {
          total: item.waiting.totalCount
        }
      })),
      preference2: result[0].preference2.map(item => ({
        center: item.center,
        selected: {
          total: item.selected.totalCount,
          admissionDone: item.selected.breakdown.find(b => b.admissionStatus === "Admission Done")?.count || 0,
          provisional: item.selected.breakdown.find(b => b.admissionStatus === "Provisional")?.count || 0,
          waiting: item.selected.breakdown.find(b => b.admissionStatus === "Waiting")?.count || 0
        },
        waiting: {
          total: item.waiting.totalCount
        }
      }))
    };

    res.status(200).json({
      success: true,
      data: transformedData
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
//----------------------------------------------------



//Below is being created for orientation certificate, so that only l2qualified students be fetched


export const FetchMbL2QualifiedStudent = async (req, res) => {



  try {

    const response = await Student.find({L2Qualified: true})

    
    return res.status(200).json({
      ok: true,
      datalength: response.length,
      message: "Data fetched successfully!",
      data: response,
    });  

  } catch (error) {
    
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: err.message,
    });

  }
}




//Updatin l3 attendance value for missino buniyaad
export const markL3AttendanceOfStudents = async (req, res) => {


  const { _id, isPresentInL3Examination } = req.body;

  console.log('mark level 3 attendance', req.body)
  
  // Validation
  if (!_id) {
    return res.status(400).json({ 
      status: 'Not OK', 
      message: 'Student ID is required' 
    });
  }
  
  if (isPresentInL3Examination === undefined) {
    return res.status(400).json({ 
      status: 'Not OK', 
      message: 'Attendance status is required' 
    });
  }
  
  try {
    const response = await Student.findByIdAndUpdate(
      _id,  // Just pass the ID directly
      { $set: { isPresentInL3Examination } },
      { 
        new: true,  // Return updated document instead of original
        runValidators: true  // Run schema validations
      }
    );
    
    if (!response) {
      return res.status(404).json({ 
        status: 'Not OK', 
        message: 'Student not found' 
      });
    }
    
    res.status(200).json({ 
      status: 'OK', 
      message: 'Attendance updated', 
      data: response 
    });
    
  } catch (error) {
    console.error(error); // Log the actual error for debugging
    res.status(500).json({ 
      status: 'Not OK', 
      message: 'Some error occurred' 
    });
  }
}