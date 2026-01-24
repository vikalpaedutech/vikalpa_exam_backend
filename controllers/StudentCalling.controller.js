import { StudentCalling } from "../models/StudentCalling.model.js";

export const CreateCallingStudent = async (req, res) => {
  try {
    const {
        CallerObjectId,
      srn,
      name,
      father,
      mobile,
      whatsapp,
      classOfStudent,
      L2ExaminationDistrict,
      L2ExaminationBlock,
      L2ExaminationCenter,
      L2ExaminationDate,
      omrcontact1,
      omrcontact2,
      callingStatus,
      remark,
      callingDate, // 👈 NEW
    } = req.body;

    const studentCalling = await StudentCalling.create({
        CallerObjectId,
      srn,
      name,
      father,
      mobile,
      whatsapp,
      classOfStudent,
      L2ExaminationDistrict,
      L2ExaminationBlock,
      L2ExaminationCenter,
      L2ExaminationDate,
      omrcontact1,
      omrcontact2,
      callingStatus,
      remark,

      // 👇 if provided use it, else schema default Date.now
      ...(callingDate && { callingDate }),
    });

    return res.status(201).json({
      success: true,
      message: "Calling student record created successfully",
      data: studentCalling,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};









export const GetTodayCallingStudents = async (req, res) => {
  try {
    const { CallerObjectId } = req.body; // 👈 from body

    console.log(req.body)
    // start of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // end of today
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const students = await StudentCalling.find({
      CallerObjectId,
      callingDate: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    }).sort({ callingDate: -1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};






export const UpdateCallingStatus = async (req, res) => {
  try {
    const { _id, callingStatus, remark, manualRemark } = req.body;

    const updatedStudent = await StudentCalling.findByIdAndUpdate(
      _id,
      {
        callingStatus,
        remark,
        manualRemark
      },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Record not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Calling status updated successfully",
      data: updatedStudent
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
