
import mongoose from "mongoose";
import { Student } from "../models/StudentModel.js"; // adjust path if needed
import { District_Block_School } from "../models/District_block_schoolsModel.js";

// Aggregation for 8th Class Dashboard with sorting


// Aggregation for counts (total, class 8, class 10, verified etc.)
// Aggregation for counts (total, class 8, class 10, verified etc.)
export const GetStudentsRegisteredByUserCount = async (req, res) => {
  try {
    const userId = req.body._id;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Please provide _id in request body" });
    }

    // Build match condition that supports both string-stored IDs and ObjectId-stored IDs
    let matchCondition;
    if (mongoose.isValidObjectId(userId)) {
      // IMPORTANT: use `new` when creating an ObjectId instance
      matchCondition = {
        $or: [
          { isRegisteredBy: userId }, // when stored as string
          { isRegisteredBy: new mongoose.Types.ObjectId(userId) } // when stored as ObjectId
        ]
      };
    } else {
      // Not a valid ObjectId — match only by string
      matchCondition = { isRegisteredBy: userId };
    }

    const pipeline = [
      { $match: matchCondition },
      {
        $facet: {
          total: [{ $count: "count" }],
          byClass: [
            {
              $group: {
                _id: "$classOfStudent",
                count: { $sum: 1 }
              }
            }
          ],
          verifiedTotal: [
            { $match: { isVerified: "Verified" } },
            { $count: "count" }
          ],
          verifiedByClass: [
            { $match: { isVerified: "Verified" } },
            {
              $group: {
                _id: "$classOfStudent",
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ];

    const aggResult = await Student.aggregate(pipeline);
    const result = (aggResult && aggResult[0]) ? aggResult[0] : {};

    const totalRegistrationCount = (result.total && result.total[0] && result.total[0].count) || 0;

    const getClassCount = (arr, className) => {
      if (!Array.isArray(arr)) return 0;
      const found = arr.find((x) => String(x._id) === String(className));
      return found ? found.count : 0;
    };

    const total8RegisteredCount = getClassCount(result.byClass, "8");
    const total10RegisteredCount = getClassCount(result.byClass, "10");

    const totalVerifiedCount = (result.verifiedTotal && result.verifiedTotal[0] && result.verifiedTotal[0].count) || 0;
    const totalVerified8Count = getClassCount(result.verifiedByClass, "8");
    const totalVerified10Count = getClassCount(result.verifiedByClass, "10");

    return res.status(200).json({
      success: true,
      data: {
        totalRegistrationCount,
        total8RegisteredCount,
        total10RegisteredCount,
        totalVerifiedCount,
        totalVerified8Count,
        totalVerified10Count
      }
    });
  } catch (err) {
    console.error("GetStudentsRegisteredByUserCount error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};





export const GetStudentsRegisteredByUser = async (req, res) => {
  try {
    const userId = req.body._id;
    const classOfStudent = req.body.classOfStudent; // 👈 added for optional class filter

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Please provide _id in request body",
      });
    }

    // Match condition (support both ObjectId & string stored)
    let matchCondition;
    if (mongoose.isValidObjectId(userId)) {
      matchCondition = {
        $or: [
          { isRegisteredBy: userId }, // stored as string
          { isRegisteredBy: new mongoose.Types.ObjectId(userId) }, // stored as ObjectId
        ],
      };
    } else {
      matchCondition = { isRegisteredBy: userId };
    }

    // 👇 add optional filter for classOfStudent
    if (classOfStudent) {
      matchCondition.classOfStudent = classOfStudent;
    }

    const students = await Student.find(matchCondition).lean();

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (err) {
    console.error("GetStudentsRegisteredByUser error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};




//Dashboard api

// controller/DashboardController.js

// IMPORTANT: adjust these imports to match your project structure / model names

/**
 * DashboardCounts controller
 * Aggregates students and writes dashboard counts into district_block_schools documents.
 *
 * The result is written to each district_block_schools doc in the `dashboardCounts` field:
 * {
 *   district: { byClass: { "8": { registered, verified, rejected, other }, ... }, totals: { registered, verified, rejected, other } },
 *   block: { ...same shape... },
 *   school: { ...same shape... }
 * }
 *
 * NOTE: this function assumes:
 *  - students have fields: schoolDistrictCode, schoolBlockCode, schoolCode, classOfStudent, isVerified, isRegisteredBy
 *  - district_block_schools documents have districtId, blockId, centerId (centerId === schoolCode)
 */
// controllers/DashboardController.js

export const DashboardCounts = async (req, res) => {

    console.log('hello dashboardd')
  try {
    // 1) Aggregate students BY schoolCode + class + isVerified (only registered)
    const pipeline = [
      {
        $match: {
          $and: [
            { isRegisteredBy: { $exists: true } },
            { isRegisteredBy: { $ne: null } },
            { isRegisteredBy: { $ne: "" } },
          ],
        },
      },
      {
        $group: {
          _id: {
            schoolCode: { $ifNull: ["$schoolCode", ""] },
            schoolName: { $ifNull: ["$school", ""] },
            classOfStudent: { $ifNull: ["$classOfStudent", "UNSPECIFIED"] },
            isVerified: { $ifNull: ["$isVerified", "UNSPECIFIED"] },
          },
          count: { $sum: 1 },
        },
      },
    ];

    const aggResults = await Student.aggregate(pipeline);

    // 2) Build schoolMap keyed by schoolCode (centerId)
    const schoolMap = {}; // centerId -> { byClass: {cls: {registered,verified,rejected,other}}, totals, meta }
    const ensureSchool = (key) => {
      if (!schoolMap[key]) {
        schoolMap[key] = {
          byClass: {},
          totals: { registered: 0, verified: 0, rejected: 0, other: 0 },
          meta: {},
        };
      }
      return schoolMap[key];
    };

    const verificationBucket = (v) => {
      if (!v) return "other";
      const s = String(v).trim().toLowerCase();
      if (s === "verified") return "verified";
      if (s === "rejected") return "rejected";
      return "other";
    };

    for (const row of aggResults) {
      const id = row._id;
      const sCode = String(id.schoolCode ?? "").trim();
      const sName = id.schoolName ?? "";
      const classKey = String(id.classOfStudent ?? "UNSPECIFIED");
      const isVerifiedRaw = id.isVerified;
      const cnt = row.count ?? 0;

      const sch = ensureSchool(sCode);
      if (sName) sch.meta.schoolName = sName;

      if (!sch.byClass[classKey]) {
        sch.byClass[classKey] = { registered: 0, verified: 0, rejected: 0, other: 0 };
      }

      sch.byClass[classKey].registered += cnt;
      sch.totals.registered += cnt;

      const bucket = verificationBucket(isVerifiedRaw);
      sch.byClass[classKey][bucket] += cnt;
      sch.totals[bucket] += cnt;
    }

    // 3) Read all centers from district_block_schools (to get meta & to aggregate block/district)
    const centers = await District_Block_School.find(
      {},
      {
        districtId: 1,
        districtName: 1,
        blockId: 1,
        blockName: 1,
        centerId: 1,
        centerName: 1,
      }
    ).lean();

    if (!centers?.length) {
      return res.status(200).json({ message: "No centers found. Nothing to return.", centers: [] });
    }

    // 4) Build blockMap and districtMap by summing schoolMap values according to centers
    const blockMap = {}; // blockId -> { byClass, totals, meta }
    const districtMap = {}; // districtId -> { byClass, totals, meta }

    const ensureAgg = (map, key, metaKeyName) => {
      if (!map[key]) {
        map[key] = {
          byClass: {},
          totals: { registered: 0, verified: 0, rejected: 0, other: 0 },
          meta: {},
        };
        if (metaKeyName) map[key].meta[metaKeyName] = key;
      }
      return map[key];
    };

    const centerResults = []; // array of centers with schoolCounts + meta

    for (const c of centers) {
      const districtId = String(c.districtId ?? "").trim();
      const blockId = String(c.blockId ?? "").trim();
      const centerId = String(c.centerId ?? "").trim();

      const schoolCounts = schoolMap[centerId] || {
        byClass: {},
        totals: { registered: 0, verified: 0, rejected: 0, other: 0 },
        meta: {},
      };

      // fill school meta from centers collection if missing
      if (!schoolCounts.meta.schoolName) schoolCounts.meta.schoolName = c.centerName || "";
      schoolCounts.meta.centerId = centerId;

      // Prepare center-level result
      centerResults.push({
        centerId,
        centerName: c.centerName || schoolCounts.meta.schoolName || "",
        blockId,
        blockName: c.blockName || "",
        districtId,
        districtName: c.districtName || "",
        dashboardCounts: {
          school: schoolCounts,
        },
      });

      // accumulate into block
      const blockEntry = ensureAgg(blockMap, blockId, "blockId");
      if (!blockEntry.meta.blockName) blockEntry.meta.blockName = c.blockName || "";
      blockEntry.meta.blockId = blockId;

      // accumulate into district
      const districtEntry = ensureAgg(districtMap, districtId, "districtId");
      if (!districtEntry.meta.districtName) districtEntry.meta.districtName = c.districtName || "";
      districtEntry.meta.districtId = districtId;

      // Add class-wise counts from schoolCounts to block & district
      for (const [cls, clsCounts] of Object.entries(schoolCounts.byClass)) {
        if (!blockEntry.byClass[cls]) blockEntry.byClass[cls] = { registered: 0, verified: 0, rejected: 0, other: 0 };
        if (!districtEntry.byClass[cls]) districtEntry.byClass[cls] = { registered: 0, verified: 0, rejected: 0, other: 0 };

        blockEntry.byClass[cls].registered += clsCounts.registered || 0;
        blockEntry.byClass[cls].verified += clsCounts.verified || 0;
        blockEntry.byClass[cls].rejected += clsCounts.rejected || 0;
        blockEntry.byClass[cls].other += clsCounts.other || 0;

        districtEntry.byClass[cls].registered += clsCounts.registered || 0;
        districtEntry.byClass[cls].verified += clsCounts.verified || 0;
        districtEntry.byClass[cls].rejected += clsCounts.rejected || 0;
        districtEntry.byClass[cls].other += clsCounts.other || 0;
      }

      // Add totals
      blockEntry.totals.registered += schoolCounts.totals.registered || 0;
      blockEntry.totals.verified += schoolCounts.totals.verified || 0;
      blockEntry.totals.rejected += schoolCounts.totals.rejected || 0;
      blockEntry.totals.other += schoolCounts.totals.other || 0;

      districtEntry.totals.registered += schoolCounts.totals.registered || 0;
      districtEntry.totals.verified += schoolCounts.totals.verified || 0;
      districtEntry.totals.rejected += schoolCounts.totals.rejected || 0;
      districtEntry.totals.other += schoolCounts.totals.other || 0;
    }

    // 5) Return a structured read-only dashboard object (no DB writes)
    return res.status(200).json({
      message: "Dashboard counts (read-only) computed from students + district_block_schools.",
      summary: {
        centersCountInDb: centers.length,
        schoolsWithRegistrations: Object.keys(schoolMap).length,
      },
      centers: centerResults,   // per-center dashboardCounts.school + meta
      blocks: blockMap,         // aggregated per block
      districts: districtMap,   // aggregated per district
    });
  } catch (error) {
    console.error("DashboarCounts (read-only) error:", error);
    return res.status(500).json({ message: "Internal server error", error: String(error) });
  }
};








export const GetRegisteredStudentsDataBySchoolAndClass = async (req, res) => {
  const { schoolCode, classOfStudent } = req.body;
  console.log(req.body);

  // Basic validation (optional but recommended)
  if (!schoolCode || !classOfStudent) {
    return res.status(400).json({ status: "error", message: "schoolCode and classOfStudent are required" });
  }

  try {
    const response = await Student.find({
      schoolCode: schoolCode,
      classOfStudent: classOfStudent,
      // use $nin to exclude null/empty/undefined
      isRegisteredBy: { $nin: [null, "", undefined] }
    });

    return res.status(200).json({
      status: "okay",
      message: "Data fetched successfully",
      data: response
    });
  } catch (error) {
    console.error("Error fetching data", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch registered students",
      error: error.message
    });
  }
};
