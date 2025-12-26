import mongoose from "mongoose";


import { ExaminationCentersAndCapacity } from "../models/ExmainationCentersAndCapacity.js";




export const createExaminationCenter = async (req, res) => {
  try {
    const {
      districtId,
      districtName,
      blockId,
      blockName,
      examinationVenueCode,
      examinationVenue,
      capacity,
      studentDistributionCount,
      examType,
      examinationLevel,
      requiredPaperCount,
      examinationVenueSequenceInBlock
    } = req.body;

    // Basic validation
    if (!examinationVenueCode || !examinationVenue || !capacity) {
      return res.status(400).json({
        success: false,
        message: "Please provide examination venue code, venue name, and capacity"
      });
    }

    // Calculate remaining capacity
    const studentCount = studentDistributionCount || 0;
    const remaining = capacity - studentCount;

    if (remaining < 0) {
      return res.status(400).json({
        success: false,
        message: "Student distribution count cannot exceed capacity"
      });
    }

    // Create new examination center
    const newCenter = await ExaminationCentersAndCapacity.create({
      districtId,
      districtName,
      blockId,
      blockName,
      examinationVenueCode,
      examinationVenue,
      capacity,
      studentDistributionCount: studentCount,
      remaining,
      examType,
      examinationLevel,
      requiredPaperCount,
      examinationVenueSequenceInBlock
    });

    res.status(201).json({
      success: true,
      message: "Examination center created successfully",
      data: newCenter
    });

  } catch (error) {
    console.error("Error creating examination center:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Examination venue code already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating examination center",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Create multiple examination centers
 * @route   POST /api/examination-centers/bulk
 * @access  Public/Private (adjust as needed)
 */
export const createMultipleExaminationCenters = async (req, res) => {
  try {
    const centers = req.body;

    if (!Array.isArray(centers) || centers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of examination centers"
      });
    }

    // Process each center to calculate remaining
    const processedCenters = centers.map(center => {
      const studentCount = center.studentDistributionCount || 0;
      return {
        ...center,
        studentDistributionCount: studentCount,
        remaining: center.capacity - studentCount
      };
    });

    // Validate all centers before insertion
    for (const center of processedCenters) {
      if (!center.examinationVenueCode || !center.examinationVenue || !center.capacity) {
        return res.status(400).json({
          success: false,
          message: "Each center must have examinationVenueCode, examinationVenue, and capacity"
        });
      }
      
      if (center.remaining < 0) {
        return res.status(400).json({
          success: false,
          message: `Student distribution exceeds capacity for venue ${center.examinationVenueCode}`
        });
      }
    }

    const createdCenters = await ExaminationCentersAndCapacity.insertMany(processedCenters);

    res.status(201).json({
      success: true,
      message: `${createdCenters.length} examination centers created successfully`,
      data: createdCenters
    });

  } catch (error) {
    console.error("Error creating multiple examination centers:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate examination venue code found"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating examination centers",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};




export const GetCentersDataByExaminationAndExamType = async (req, res) =>{

    try {
    // const { examinationLevel, examType, districtId, blockId, examinationVenueCode } = req.body;
    
    
    const examinationLevel = "1"
    const examType = "MB"
    
    
    // Check if required parameters are provided
    if (!examinationLevel || !examType) {
      return res.status(400).json({
        success: false,
        message: "Both examinationLevel and examType are required"
      });
    }
    
    // Build filter object
    const filter = {
      examinationLevel,
      examType
    };
    
    
    
    // Get examination centers with the filters
    const centers = await ExaminationCentersAndCapacity.find(filter)
      .sort({ examinationVenueCode: 1 });
    
    res.status(200).json({
      success: true,
      count: centers.length,
      data: centers
    });

  } catch (error) {
    console.error("Error fetching examination centers:", error);
    
    res.status(500).json({
      success: false,
      message: "Server error while fetching examination centers",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};






//Update


export const updateExaminationCentersAndCapacity = async (req, res) => {
  try {
    const { id, examinationVenueCode, attendanceCount } = req.body;

    console.log('i am inside')
    console.log(req.body)

    if (!attendanceCount) {
      return res.status(400).json({
        success: false,
        message: "attendanceCount is required",
      });
    }

    let filter = {};

    if (id) {
      filter._id = id;
    } else if (examinationVenueCode) {
      filter.examinationVenueCode = examinationVenueCode;
    } else {
      return res.status(400).json({
        success: false,
        message: "Either id or examinationVenueCode is required",
      });
    }

    const updatedCenter = await ExaminationCentersAndCapacity.findOneAndUpdate(
      filter,
      { $set: { attendanceCount } },
      { new: true }
    );

    if (!updatedCenter) {
      return res.status(404).json({
        success: false,
        message: "Examination center not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Attendance count updated successfully",
      data: updatedCenter,
    });
  } catch (error) {
    console.error("Update attendanceCount error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};