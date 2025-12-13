import mongoose from "mongoose";


import { CallLog } from "../models/ABRC_principal_beo_calling_model.js";








export const CreateCallLogs = async (req, res) => {
  try {
    const data = req.body;
    console.log("CreateCallLogs req.body:", data);

    // callerId required
    if (!data.callerId || data.callerId === 'unknown') {
      return res.status(400).json({
        success: false,
        message: "Valid callerId is required",
      });
    }

    // validate ObjectId format for callerId if it's provided
    if (!mongoose.Types.ObjectId.isValid(data.callerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid callerId format",
      });
    }

    // optional: ensure blockId present (since you're sending block-level logs)
    if (!data.blockId) {
      return res.status(400).json({
        success: false,
        message: "blockId is required for block-level call logs",
      });
    }

    // Create log — centerId may be empty or missing
    const newLog = await CallLog.create({
      callerId: new mongoose.Types.ObjectId(data.callerId),
      districtId: data.districtId,
      districtName: data.districtName,
      blockId: data.blockId,
      blockName: data.blockName,
      centerId: data.centerId || "", // optional
      centerName: data.centerName || "",
      schoolType: data.schoolType || "",
     calledTo:data.calledTo,
      abrc: data.abrc || null,
      abrcContact: data.abrcContact || null,
      principal: data.principal || null,
      princiaplContact: data.princiaplContact || null,
      principalAbrcDataUpdatedBy: data.principalAbrcDataUpdatedBy || null,
      callingStatus: data.callingStatus || null,
      callingRemark: data.callingRemark || null,
      manualRemark: data.manualRemark || null,
    });

    return res.status(201).json({
      success: true,
      message: "Call log created successfully",
      data: newLog,
    });

  } catch (error) {
    console.error("Error creating call log:", error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate entry found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};





// export const GetCallLogsCurrentData = async (req, res) => {
//   try {
//     // accept callerId from query (?callerId=...) or route params (:callerId)
//   //  const callerId = req.query.callerId ?? req.params.callerId ?? null;

//         const {callerId} = req.body;


//     if (!callerId) {
//       return res.status(400).json({
//         success: false,
//         message: "callerId is required as query param or route param",
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(callerId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid callerId format",
//       });
//     }

//     // compute IST start and end in UTC for today's date in Asia/Kolkata
//     const now = new Date();
//     const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
//     const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +5:30
//     const istNow = new Date(utcMs + IST_OFFSET_MS);
//     const startOfIstDay = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 0, 0, 0, 0);
//     const startUtc = new Date(startOfIstDay.getTime() - IST_OFFSET_MS);
//     const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000 - 1);

//     // pagination
//     const page = Math.max(1, parseInt(req.query.page, 10) || 1);
//     const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 1000));
//     const skip = (page - 1) * limit;

//     // build filter: callerId + createdAt range
//     const filter = {
//       callerId: new mongoose.Types.ObjectId(callerId),
//       createdAt: { $gte: startUtc, $lte: endUtc },
//     };

//     const [logs, total] = await Promise.all([
//       CallLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
//       CallLog.countDocuments(filter),
//     ]);

//     return res.status(200).json({
//       success: true,
//       message: "Call logs for caller for current IST date fetched successfully",
//       data: logs,
//       meta: {
//         count: logs.length,
//         total,
//         page,
//         limit,
//         queriedRange: {
//           startUtc: startUtc.toISOString(),
//           endUtc: endUtc.toISOString(),
//         },
//         timezone: "Asia/Kolkata",
//       },
//     });
//   } catch (error) {
//     console.error("GetCallLogsCurrentData error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };




















export const GetCallLogsCurrentData = async (req, res) => {
  try {
    // read callerId from req.body (you asked to use POST body)
    const { callerId } = req.body;

    if (!callerId) {
      return res.status(400).json({
        success: false,
        message: "callerId is required in request body",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(callerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid callerId format",
      });
    }

    // compute IST start of today and range covering previous 5 days
    // (this returns logs from startOfDayIST - 5 days up to endOfTodayIST)
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30
    const istNow = new Date(utcMs + IST_OFFSET_MS);

    // start of current IST day (00:00:00)
    const startOfIstDay = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 0, 0, 0, 0);

    // range start: start of IST day minus 5 days
    const RANGE_DAYS_BACK = 5; // previous 5 days + today
    const rangeStartIst = new Date(startOfIstDay.getTime() - RANGE_DAYS_BACK * 24 * 60 * 60 * 1000);

    // convert range start and end back to UTC for Mongo query
    const rangeStartUtc = new Date(rangeStartIst.getTime() - IST_OFFSET_MS);
    const rangeEndUtc = new Date(startOfIstDay.getTime() - IST_OFFSET_MS + 24 * 60 * 60 * 1000 - 1); // end of today IST in UTC

    
    // pagination (still via query params if provided)
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 1000));
    const skip = (page - 1) * limit;

    // build filter: callerId + createdAt range
    const filter = {
      callerId: new mongoose.Types.ObjectId(callerId),
      createdAt: { $gte: rangeStartUtc, $lte: rangeEndUtc },
    };

    // fetch logs + total count + distinct callingRemark values (previous remarks)
    const [logs, total, distinctRemarks] = await Promise.all([
      CallLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CallLog.countDocuments(filter),
      CallLog.distinct("callingRemark", filter),
    ]);

    // normalize distinct remarks (remove null/empty and trim)
    const previousRemarks = (distinctRemarks || [])
      .filter(r => r !== null && r !== undefined)
      .map(r => (typeof r === "string" ? r.trim() : r))
      .filter(r => r !== "");

    return res.status(200).json({
      success: true,
      message: "Call logs for caller for current IST date range (today + previous 5 days) fetched successfully",
      data: logs,
      meta: {
        count: logs.length,
        total,
        page,
        limit,
        queriedRange: {
          startUtc: rangeStartUtc.toISOString(),
          endUtc: rangeEndUtc.toISOString(),
        },
        timezone: "Asia/Kolkata",
        note: "Range covers today and the previous 5 days (6 calendar days total).",
      },
      previousRemarks,
    });
  } catch (error) {
    console.error("GetCallLogsCurrentData error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
