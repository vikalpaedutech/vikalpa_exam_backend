
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
      $or: [{ srn: data.srn }, { aadhar: data.aadhar }],
    });

    if (existing) {
      return res.status(409).json({ message: "Student with this SRN or Aadhar already exists." });
    }

    // If an image file was uploaded (multer placed it on req.file), upload to DO Spaces
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
