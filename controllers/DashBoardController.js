
import mongoose from "mongoose";
import { Student } from "../models/StudentModel.js"; // adjust path if needed
import { District_Block_School } from "../models/District_block_schoolsModel.js";
import { UserAccess, User } from "../models/UserModel.js";
import { CallLeads } from "../models/CallLeadsModel.js";
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




// export const MainDashBoard = async (req, res) => {


//   console.log('Hello main dashboard')
// try {
//  const dashBoardPipline = await District_Block_School.aggregate([
//   {
//     $lookup: {
//       from: "students",
//       let: { schoolCode: "$schoolCode" },
//       pipeline: [
//         { $match: { $expr: { $eq: ["$centerId", "$$schoolCode"] } } },
//         { $count: "studentCount" }  // only get counts instead of full docs
//       ],
//       as: "dashboard"
//     }
//   },
//   {
//     $addFields: {
//       studentCount: { $ifNull: [{ $arrayElemAt: ["$dashboard.studentCount", 0] }, 0] }
//     }
//   },
//   {
//     $project: { dashboard: 0 } // optional, remove full array
//   }
// ]);


//   res.status(200).json({status:"Ok", data:dashBoardPipline})
// } catch (error) {
//   console.error('Erorr', error)
  
// }


// }



// export const MainDashBoard = async (req, res) => {
//   console.log("Hello main dashboard");
//   try {
//     const dashBoardPipline = await District_Block_School.aggregate([
//       {
//         $lookup: {
//           from: "students",
//           let: { schoolCode: "$schoolCode" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $eq: ["$centerId", "$$schoolCode"] },
//                 isRegisteredBy: { $ne: "" }, // only consider registered students
//               },
//             },
//             {
//               $group: {
//                 _id: null,
//                 regCount8: { $sum: { $cond: [{ $eq: ["$classOfStudent", "8"] }, 1, 0] } },
//                 regCount10: { $sum: { $cond: [{ $eq: ["$classOfStudent", "10"] }, 1, 0] } },
//                 isL1AdmitCardDownloadedCount: {
//                   $sum: { $cond: ["$isL1AdmitCardDownloaded", 1, 0] },
//                 },
//                 L1ResultDownloadedCount: {
//                   $sum: { $cond: ["$L1ResultDownloaded", 1, 0] },
//                 },
//                 L1Qualified: { $sum: { $cond: ["$L1Qualified", 1, 0] } },
//               },
//             },
//           ],
//           as: "dashboard",
//         },
//       },
//       {
//         $addFields: {
//           regCount8: { $ifNull: [{ $arrayElemAt: ["$dashboard.regCount8", 0] }, 0] },
//           regCount10: { $ifNull: [{ $arrayElemAt: ["$dashboard.regCount10", 0] }, 0] },
//           isL1AdmitCardDownloadedCount: {
//             $ifNull: [
//               { $arrayElemAt: ["$dashboard.isL1AdmitCardDownloadedCount", 0] },
//               0,
//             ],
//           },
//           L1ResultDownloadedCount: {
//             $ifNull: [{ $arrayElemAt: ["$dashboard.L1ResultDownloadedCount", 0] }, 0],
//           },
//           L1Qualified: { $ifNull: [{ $arrayElemAt: ["$dashboard.L1Qualified", 0] }, 0] },
//         },
//       },
//       {
//         $project: { dashboard: 0 }, // remove full array
//       },
//     ]);

//     res.status(200).json({ status: "Ok", data: dashBoardPipline });
//   } catch (error) {
//     console.error("Error", error);
//     res.status(500).json({ status: "error", message: error.message || "Server error" });
//   }
// };




// export const MainDashBoard = async (req, res) => {
//   console.log("Hello main dashboard");
//   try {
//     const dashBoardPipline = await District_Block_School.aggregate([
//       {
//         $lookup: {
//           from: "students",
//           let: { schoolCode: "$schoolCode" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $eq: ["$centerId", "$$schoolCode"] },
//                 isRegisteredBy: { $ne: "" }, // only consider registered students
//               },
//             },
//             {
//               $group: {
//                 _id: "$centerId", // YAHAN CHANGE KARNA HAI - null ki jagah centerId
//                 // Class 8 counts
//                 regCount8: { 
//                   $sum: { 
//                     $cond: [{ $eq: ["$classOfStudent", "8"] }, 1, 0] 
//                   } 
//                 },
//                 isL1AdmitCardDownloadedCount8: {
//                   $sum: { 
//                     $cond: [
//                       { 
//                         $and: [
//                           { $eq: ["$classOfStudent", "8"] },
//                           "$isL1AdmitCardDownloaded"
//                         ] 
//                       }, 
//                       1, 
//                       0 
//                     ] 
//                   }
//                 },
//                 L1ResultDownloadedCount8: {
//                   $sum: { 
//                     $cond: [
//                       { 
//                         $and: [
//                           { $eq: ["$classOfStudent", "8"] },
//                           "$L1ResultDownloaded"
//                         ] 
//                       }, 
//                       1, 
//                       0 
//                     ] 
//                   }
//                 },
//                 L1Qualified8: {
//                   $sum: { 
//                     $cond: [
//                       { 
//                         $and: [
//                           { $eq: ["$classOfStudent", "8"] },
//                           "$L1Qualified"
//                         ] 
//                       }, 
//                       1, 
//                       0 
//                     ] 
//                   }
//                 },
                
//                 // Class 10 counts
//                 regCount10: { 
//                   $sum: { 
//                     $cond: [{ $eq: ["$classOfStudent", "10"] }, 1, 0] 
//                   } 
//                 },
//                 isL1AdmitCardDownloadedCount10: {
//                   $sum: { 
//                     $cond: [
//                       { 
//                         $and: [
//                           { $eq: ["$classOfStudent", "10"] },
//                           "$isL1AdmitCardDownloaded"
//                         ] 
//                       }, 
//                       1, 
//                       0 
//                     ] 
//                   }
//                 },
//                 L1ResultDownloadedCount10: {
//                   $sum: { 
//                     $cond: [
//                       { 
//                         $and: [
//                           { $eq: ["$classOfStudent", "10"] },
//                           "$L1ResultDownloaded"
//                         ] 
//                       }, 
//                       1, 
//                       0 
//                     ] 
//                   }
//                 },
//                 L1Qualified10: {
//                   $sum: { 
//                     $cond: [
//                       { 
//                         $and: [
//                           { $eq: ["$classOfStudent", "10"] },
//                           "$L1Qualified"
//                         ] 
//                       }, 
//                       1, 
//                       0 
//                     ] 
//                   }
//                 }
//               },
//             },
//           ],
//           as: "dashboard",
//         },
//       },
//       {
//         $addFields: {
//           regCount8: { $ifNull: [{ $arrayElemAt: ["$dashboard.regCount8", 0] }, 0] },
//           regCount10: { $ifNull: [{ $arrayElemAt: ["$dashboard.regCount10", 0] }, 0] },
          
//           isL1AdmitCardDownloadedCount8: {
//             $ifNull: [
//               { $arrayElemAt: ["$dashboard.isL1AdmitCardDownloadedCount8", 0] },
//               0,
//             ],
//           },
//           L1ResultDownloadedCount8: {
//             $ifNull: [
//               { $arrayElemAt: ["$dashboard.L1ResultDownloadedCount8", 0] },
//               0,
//             ],
//           },
//           L1Qualified8: {
//             $ifNull: [
//               { $arrayElemAt: ["$dashboard.L1Qualified8", 0] },
//               0,
//             ],
//           },
          
//           isL1AdmitCardDownloadedCount10: {
//             $ifNull: [
//               { $arrayElemAt: ["$dashboard.isL1AdmitCardDownloadedCount10", 0] },
//               0,
//             ],
//           },
//           L1ResultDownloadedCount10: {
//             $ifNull: [
//               { $arrayElemAt: ["$dashboard.L1ResultDownloadedCount10", 0] },
//               0,
//             ],
//           },
//           L1Qualified10: {
//             $ifNull: [
//               { $arrayElemAt: ["$dashboard.L1Qualified10", 0] },
//               0,
//             ],
//           },
//         },
//       },
//       {
//         $project: { dashboard: 0 }, // remove full array
//       },
//     ]);

//     res.status(200).json({ status: "Ok", data: dashBoardPipline });
//   } catch (error) {
//     console.error("Error", error);
//     res.status(500).json({ status: "error", message: error.message || "Server error" });
//   }
// };








// export const MainDashBoard = async (req, res) => {
//   console.log("Hello main dashboard");
//   try {
//     const aggregationPipeline = [
//       {
//         $lookup: {
//           from: "students",
//           let: { centerId: "$centerId" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$schoolCode", "$$centerId"] },
//                     { $in: ["$classOfStudent", ["8", "10"]] },
//                     { $and: [
//                       { $ne: ["$isRegisteredBy", ""] },
//                       { $ne: ["$isRegisteredBy", null] }
//                     ]}
//                   ]
//                 }
//               }
//             },
//             {
//               $group: {
//                 _id: "$classOfStudent",
//                 count: { $sum: 1 }
//               }
//             }
//           ],
//           as: "classRegistrations"
//         }
//       },
//       {
//         $addFields: {
//           registrationCount8: {
//             $let: {
//               vars: {
//                 class8: {
//                   $arrayElemAt: [
//                     {
//                       $filter: {
//                         input: "$classRegistrations",
//                         as: "reg",
//                         cond: { $eq: ["$$reg._id", "8"] }
//                       }
//                     },
//                     0
//                   ]
//                 }
//               },
//               in: { $ifNull: ["$$class8.count", 0] }
//             }
//           },
//           registrationCount10: {
//             $let: {
//               vars: {
//                 class10: {
//                   $arrayElemAt: [
//                     {
//                       $filter: {
//                         input: "$classRegistrations",
//                         as: "reg",
//                         cond: { $eq: ["$$reg._id", "10"] }
//                       }
//                     },
//                     0
//                   ]
//                 }
//               },
//               in: { $ifNull: ["$$class10.count", 0] }
//             }
//           },
//           totalRegistrations: {
//             $sum: "$classRegistrations.count"
//           }
//         }
//       },
//       {
//         $project: {
//           classRegistrations: 0
//         }
//       }
//     ];

//     const result = await District_Block_School.aggregate(aggregationPipeline);
    
//     console.log("Total schools processed:", result.length);
    
//     res.status(200).json({ 
//       status: "success", 
//       data: result,
//       message: "Dashboard data fetched successfully" 
//     });
    
//   } catch (error) {
//     console.error("Error", error);
//     res.status(500).json({ status: "error", message: error.message || "Server error" });
//   }
// };










// export const MainDashBoard = async (req, res) => {
//   console.log("Hello main dashboard");
//   try {
//     const aggregationPipeline = [
//       // First, group by centerId to remove duplicates and get unique schools
//       {
//         $group: {
//           _id: "$centerId",
//           doc: { $first: "$$ROOT" }
//         }
//       },
//       {
//         $replaceRoot: { newRoot: "$doc" }
//       },
//       // Then perform the lookup for student counts
//       {
//         $lookup: {
//           from: "students",
//           let: { centerId: "$centerId" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$schoolCode", "$$centerId"] },
//                     { $in: ["$classOfStudent", ["8", "10"]] },
//                     { $and: [
//                       { $ne: ["$isRegisteredBy", ""] },
//                       { $ne: ["$isRegisteredBy", null] }
//                     ]}
//                   ]
//                 }
//               }
//             },
//             {
//               $group: {
//                 _id: "$classOfStudent",
//                 count: { $sum: 1 }
//               }
//             }
//           ],
//           as: "classRegistrations"
//         }
//       },
//       {
//         $addFields: {
//           registrationCount8: {
//             $let: {
//               vars: {
//                 class8: {
//                   $arrayElemAt: [
//                     {
//                       $filter: {
//                         input: "$classRegistrations",
//                         as: "reg",
//                         cond: { $eq: ["$$reg._id", "8"] }
//                       }
//                     },
//                     0
//                   ]
//                 }
//               },
//               in: { $ifNull: ["$$class8.count", 0] }
//             }
//           },
//           registrationCount10: {
//             $let: {
//               vars: {
//                 class10: {
//                   $arrayElemAt: [
//                     {
//                       $filter: {
//                         input: "$classRegistrations",
//                         as: "reg",
//                         cond: { $eq: ["$$reg._id", "10"] }
//                       }
//                     },
//                     0
//                   ]
//                 }
//               },
//               in: { $ifNull: ["$$class10.count", 0] }
//             }
//           },
//           totalRegistrations: {
//             $sum: "$classRegistrations.count"
//           }
//         }
//       },
//       {
//         $project: {
//           classRegistrations: 0
//         }
//       }
//     ];

//     const result = await District_Block_School.aggregate(aggregationPipeline);
    
//     console.log("Total unique schools processed:", result.length);
    
//     res.status(200).json({ 
//       status: "success", 
//       data: result,
//       message: "Dashboard data fetched successfully" 
//     });
    
//   } catch (error) {
//     console.error("Error", error);
//     res.status(500).json({ status: "error", message: error.message || "Server error" });
//   }
// };







export const MainDashBoard = async (req, res) => {
  console.log("Hello main dashboard");
  try {
    const aggregationPipeline = [
      {
        $group: {
          _id: "$centerId",
          doc: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$doc" }
      },
      {
        $lookup: {
          from: "students",
          let: { centerId: "$centerId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$schoolCode", "$$centerId"] },
                    { $in: ["$classOfStudent", ["8", "10"]] },
                    {
                      $and: [
                        { $ne: ["$isRegisteredBy", ""] },
                        { $ne: ["$isRegisteredBy", null] }
                      ]
                    }
                  ]
                }
              }
            },
            {
              $group: {
                _id: "$classOfStudent",
                count: { $sum: 1 }
              }
            }
          ],
          as: "classRegistrations"
        }
      },
      {
        $addFields: {
          registrationCount8: {
            $let: {
              vars: {
                class8: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$classRegistrations",
                        as: "reg",
                        cond: { $eq: ["$$reg._id", "8"] }
                      }
                    },
                    0
                  ]
                }
              },
              in: { $ifNull: ["$$class8.count", 0] }
            }
          },
          registrationCount10: {
            $let: {
              vars: {
                class10: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$classRegistrations",
                        as: "reg",
                        cond: { $eq: ["$$reg._id", "10"] }
                      }
                    },
                    0
                  ]
                }
              },
              in: { $ifNull: ["$$class10.count", 0] }
            }
          },
          totalRegistrations: {
            $sum: "$classRegistrations.count"
          }
        }
      },
      {
        $project: {
          classRegistrations: 0
        }
      }
    ];

    const result = await District_Block_School.aggregate(aggregationPipeline);

    // ✅ NEW: compute totals WITHOUT touching aggregation
    let totalCount8 = 0;
    let totalCount10 = 0;

    for (const school of result) {
      totalCount8 += Number(school.registrationCount8 || 0);
      totalCount10 += Number(school.registrationCount10 || 0);
    }

    console.log("Total unique schools processed:", result.length);

    res.status(200).json({
      status: "success",
      data: result,               // 🔒 unchanged
      totalCount8,                // ➕ added
      totalCount10,               // ➕ added
      message: "Dashboard data fetched successfully"
    });

  } catch (error) {
    console.error("Error", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Server error"
    });
  }
};





// export const getCallSummary = async (req, res) => {
//   try {
//     const { callMadeTo, startDate, endDate, districtId, blockId } = req.body;

//     console.log('=== REQUEST BODY ===', req.body);

//     // Validate required field
//     if (!callMadeTo) {
//       return res.status(400).json({
//         success: false,
//         message: "callMadeTo is required in request body"
//       });
//     }

//     // Validate callMadeTo value
//     const validCallMadeTo = ["Principal", "ABRC", "BEO", "DEO"];
//     if (!validCallMadeTo.includes(callMadeTo)) {
//       return res.status(400).json({
//         success: false,
//         message: "callMadeTo must be one of: Principal, ABRC, BEO, DEO"
//       });
//     }

//     // Build location filter
//     const locationFilter = {};
//     if (districtId) locationFilter.districtId = districtId;
//     if (blockId) locationFilter.blockId = blockId;

//     console.log('=== LOCATION FILTER ===', locationFilter);

//     // DEBUG: First check ALL schools without contact filter
//     const allSchools = await District_Block_School.find(locationFilter).limit(5);
//     console.log('=== ALL SCHOOLS SAMPLE ===', allSchools.length);
//     allSchools.forEach(school => {
//       console.log(`School: ${school.centerName}, District: ${school.districtId}, Block: ${school.blockId}`);
//       console.log(`Principal: ${school.principal}, Contact: ${school.principalContact}`);
//       console.log(`ABRC: ${school.abrc}, Contact: ${school.abrcContact}`);
//       console.log(`BEO: ${school.beo}, Contact: ${school.beoContact}`);
//       console.log(`DEO: ${school.deo}, Contact: ${school.deoContact}`);
//       console.log('---');
//     });

//     // FIXED: Use proper field names based on your actual data structure
//     let contactField, nameField;
    
//     switch(callMadeTo) {
//       case "Principal":
//         contactField = "princiaplContact"; // Note: Your data has typo "princiaplContact"
//         nameField = "principal";
//         break;
//       case "ABRC":
//         contactField = "abrcContact";
//         nameField = "abrc";
//         break;
//       case "BEO":
//         contactField = "beoContact";
//         nameField = "beo";
//         break;
//       case "DEO":
//         contactField = "deoContact";
//         nameField = "deo";
//         break;
//     }

//     console.log(`=== USING FIELDS === Contact: ${contactField}, Name: ${nameField}`);

//     // FIXED: Check schools with the correct contact field
//     const schoolMatchFilter = {
//       ...locationFilter,
//       [contactField]: { $exists: true, $ne: null, $ne: "" }
//     };

//     console.log('=== SCHOOL MATCH FILTER ===', schoolMatchFilter);

//     const debugSchools = await District_Block_School.find(schoolMatchFilter).limit(5);
//     console.log('=== DEBUG SCHOOLS FOUND ===', debugSchools.length);
//     debugSchools.forEach(school => {
//       console.log(`School: ${school.centerName}, District: ${school.districtId}, Block: ${school.blockId}`);
//       console.log(`Contact: ${school[contactField]}, Name: ${school[nameField]}`);
//     });

//     // Get counts from District_Block_School collection - FIXED FIELD NAMES
//     const schoolAggregate = await District_Block_School.aggregate([
//       {
//         $match: schoolMatchFilter
//       },
//       {
//         $group: {
//           _id: {
//             districtId: "$districtId",
//             districtName: "$districtName",
//             blockId: "$blockId",
//             blockName: "$blockName"
//           },
//           totalCount: { $sum: 1 },
//           uniqueContacts: {
//             $addToSet: `$${contactField}`
//           }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           districtId: "$_id.districtId",
//           districtName: "$_id.districtName",
//           blockId: "$_id.blockId",
//           blockName: "$_id.blockName",
//           totalCount: 1,
//           uniqueContactCount: { $size: "$uniqueContacts" }
//         }
//       },
//       { $sort: { districtId: 1, blockId: 1 } }
//     ]);

//     console.log('=== SCHOOL AGGREGATE RESULT ===', schoolAggregate);

//     // Get call statistics from CallLeads collection
//     const callMatchFilter = {
//       callMadeTo: callMadeTo,
//       ...locationFilter,
//       isActive: true
//     };

//     if (startDate || endDate) {
//       callMatchFilter.callingDate = {};
//       if (startDate) callMatchFilter.callingDate.$gte = new Date(startDate);
//       if (endDate) callMatchFilter.callingDate.$lte = new Date(endDate);
//     }

//     const callStatsAggregate = await CallLeads.aggregate([
//       {
//         $match: callMatchFilter
//       },
//       {
//         $group: {
//           _id: {
//             districtId: "$districtId",
//             blockId: "$blockId"
//           },
//           totalCallsAssigned: { $sum: 1 },
//           connectedCalls: {
//             $sum: { $cond: [{ $eq: ["$callingStatus", "Connected"] }, 1, 0] }
//           },
//           notConnectedCalls: {
//             $sum: { $cond: [{ $eq: ["$callingStatus", "Not connected"] }, 1, 0] }
//           },
//           pendingCalls: {
//             $sum: {
//               $cond: [
//                 { $or: [{ $eq: ["$callingStatus", null] }, { $eq: ["$callingStatus", ""] }] },
//                 1,
//                 0
//               ]
//             }
//           }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           districtId: "$_id.districtId",
//           blockId: "$_id.blockId",
//           totalCallsAssigned: 1,
//           connectedCalls: 1,
//           notConnectedCalls: 1,
//           pendingCalls: 1
//         }
//       },
//       { $sort: { districtId: 1, blockId: 1 } }
//     ]);

//     console.log('=== CALL STATS AGGREGATE RESULT ===', callStatsAggregate.length, 'records');

//     // Combine both results
//     const combinedResult = schoolAggregate.map(schoolItem => {
//       const callStats = callStatsAggregate.find(
//         callItem =>
//           callItem.districtId === schoolItem.districtId &&
//           callItem.blockId === schoolItem.blockId
//       );

//       return {
//         districtId: schoolItem.districtId,
//         districtName: schoolItem.districtName,
//         blockId: schoolItem.blockId,
//         blockName: schoolItem.blockName,
//         summary: {
//           totalPersons: schoolItem.totalCount,
//           uniqueContacts: schoolItem.uniqueContactCount,
//           calls: {
//             totalAssigned: callStats?.totalCallsAssigned || 0,
//             connected: callStats?.connectedCalls || 0,
//             notConnected: callStats?.notConnectedCalls || 0,
//             pending: callStats?.pendingCalls || 0
//           }
//         }
//       };
//     });

//     console.log('=== COMBINED RESULT ===', combinedResult);

//     // Calculate overall totals
//     const overallTotals = {
//       totalPersons: combinedResult.reduce((sum, item) => sum + item.summary.totalPersons, 0),
//       uniqueContacts: combinedResult.reduce((sum, item) => sum + item.summary.uniqueContacts, 0),
//       totalAssigned: combinedResult.reduce((sum, item) => sum + item.summary.calls.totalAssigned, 0),
//       connected: combinedResult.reduce((sum, item) => sum + item.summary.calls.connected, 0),
//       notConnected: combinedResult.reduce((sum, item) => sum + item.summary.calls.notConnected, 0),
//       pending: combinedResult.reduce((sum, item) => sum + item.summary.calls.pending, 0)
//     };

//     res.status(200).json({
//       success: true,
//       data: {
//         callMadeTo,
//         dateRange: {
//           startDate: startDate || "Not specified",
//           endDate: endDate || "Not specified"
//         },
//         filters: {
//           districtId: districtId || "All",
//           blockId: blockId || "All"
//         },
//         summaryByDistrictBlock: combinedResult,
//         overallSummary: overallTotals
//       }
//     });

//   } catch (error) {
//     console.error("Error in getCallSummary:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };







// export const getCallSummary = async (req, res) => {
//   try {
//     const { callMadeTo, startDate, endDate, districtId, blockId } = req.body;

//     console.log('=== REQUEST BODY ===', req.body);

//     // Validate required field
//     if (!callMadeTo) {
//       return res.status(400).json({
//         success: false,
//         message: "callMadeTo is required in request body"
//       });
//     }

//     // Validate callMadeTo value
//     const validCallMadeTo = ["Principal", "ABRC", "BEO", "DEO"];
//     if (!validCallMadeTo.includes(callMadeTo)) {
//       return res.status(400).json({
//         success: false,
//         message: "callMadeTo must be one of: Principal, ABRC, BEO, DEO"
//       });
//     }

//     // Build location filter
//     const locationFilter = {};
//     if (districtId) locationFilter.districtId = districtId;
//     if (blockId) locationFilter.blockId = blockId;

//     console.log('=== LOCATION FILTER ===', locationFilter);

//     // DEBUG: First check ALL schools without contact filter
//     const allSchools = await District_Block_School.find(locationFilter).limit(5);
//     console.log('=== ALL SCHOOLS SAMPLE ===', allSchools.length);
//     allSchools.forEach(school => {
//       console.log(`School: ${school.centerName}, District: ${school.districtId}, Block: ${school.blockId}`);
//       console.log(`Principal: ${school.principal}, Contact: ${school.principalContact}`);
//       console.log(`ABRC: ${school.abrc}, Contact: ${school.abrcContact}`);
//       console.log(`BEO: ${school.beo}, Contact: ${school.beoContact}`);
//       console.log(`DEO: ${school.deo}, Contact: ${school.deoContact}`);
//       console.log('---');
//     });

//     // FIXED: Use proper field names based on your actual data structure
//     let contactField, nameField;
    
//     switch(callMadeTo) {
//       case "Principal":
//         contactField = "princiaplContact"; // Note: Your data has typo "princiaplContact"
//         nameField = "principal";
//         break;
//       case "ABRC":
//         contactField = "abrcContact";
//         nameField = "abrc";
//         break;
//       case "BEO":
//         contactField = "beoContact";
//         nameField = "beo";
//         break;
//       case "DEO":
//         contactField = "deoContact";
//         nameField = "deo";
//         break;
//     }

//     console.log(`=== USING FIELDS === Contact: ${contactField}, Name: ${nameField}`);

//     // FIXED: Check schools with the correct contact field
//     const schoolMatchFilter = {
//       ...locationFilter,
//       [contactField]: { $exists: true, $ne: null, $ne: "" }
//     };

//     console.log('=== SCHOOL MATCH FILTER ===', schoolMatchFilter);

//     const debugSchools = await District_Block_School.find(schoolMatchFilter).limit(5);
//     console.log('=== DEBUG SCHOOLS FOUND ===', debugSchools.length);
//     debugSchools.forEach(school => {
//       console.log(`School: ${school.centerName}, District: ${school.districtId}, Block: ${school.blockId}`);
//       console.log(`Contact: ${school[contactField]}, Name: ${school[nameField]}`);
//     });

//     // Get user data based on callMadeTo type
//     let userDesignation, userAccessFilter;
    
//     if (callMadeTo === "Principal" || callMadeTo === "ABRC") {
//       userDesignation = "Center Coordinator";
//     } else if (callMadeTo === "BEO") {
//       userDesignation = "ACI";
//     }

//     console.log(`=== USER CONFIG === Designation: ${userDesignation}`);

//     // Get users with their access data
//     let assignedUsers = [];
//     if (userDesignation) {
//       assignedUsers = await User.aggregate([
//         {
//           $match: { designation: userDesignation }
//         },
//         {
//           $lookup: {
//             from: "useraccesses",
//             localField: "_id",
//             foreignField: "unqUserObjectId",
//             as: "accessData"
//           }
//         },
//         {
//           $unwind: {
//             path: "$accessData",
//             preserveNullAndEmptyArrays: true
//           }
//         },
//         {
//           $unwind: {
//             path: "$accessData.region",
//             preserveNullAndEmptyArrays: true
//           }
//         },
//         {
//           $unwind: {
//             path: "$accessData.region.blockIds",
//             preserveNullAndEmptyArrays: true
//           }
//         },
//         {
//           $project: {
//             _id: 1,
//             userName: 1,
//             designation: 1,
//             mobile: 1,
//             districtId: "$accessData.region.districtId",
//             blockId: "$accessData.region.blockIds.blockId"
//           }
//         }
//       ]);

//       console.log(`=== ASSIGNED USERS FOUND ===`, assignedUsers.length);
//       console.log('Sample assigned users:', assignedUsers.slice(0, 3));
//     }

//     // Get counts from District_Block_School collection - FIXED FIELD NAMES
//     const schoolAggregate = await District_Block_School.aggregate([
//       {
//         $match: schoolMatchFilter
//       },
//       {
//         $group: {
//           _id: {
//             districtId: "$districtId",
//             districtName: "$districtName",
//             blockId: "$blockId",
//             blockName: "$blockName"
//           },
//           totalCount: { $sum: 1 },
//           uniqueContacts: {
//             $addToSet: `$${contactField}`
//           }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           districtId: "$_id.districtId",
//           districtName: "$_id.districtName",
//           blockId: "$_id.blockId",
//           blockName: "$_id.blockName",
//           totalCount: 1,
//           uniqueContactCount: { $size: "$uniqueContacts" }
//         }
//       },
//       { $sort: { districtId: 1, blockId: 1 } }
//     ]);

//     console.log('=== SCHOOL AGGREGATE RESULT ===', schoolAggregate);

//     // Get call statistics from CallLeads collection
//     const callMatchFilter = {
//       callMadeTo: callMadeTo,
//       ...locationFilter,
//       isActive: true
//     };

//     if (startDate || endDate) {
//       callMatchFilter.callingDate = {};
//       if (startDate) callMatchFilter.callingDate.$gte = new Date(startDate);
//       if (endDate) callMatchFilter.callingDate.$lte = new Date(endDate);
//     }

//     const callStatsAggregate = await CallLeads.aggregate([
//       {
//         $match: callMatchFilter
//       },
//       {
//         $group: {
//           _id: {
//             districtId: "$districtId",
//             blockId: "$blockId"
//           },
//           totalCallsAssigned: { $sum: 1 },
//           connectedCalls: {
//             $sum: { $cond: [{ $eq: ["$callingStatus", "Connected"] }, 1, 0] }
//           },
//           notConnectedCalls: {
//             $sum: { $cond: [{ $eq: ["$callingStatus", "Not connected"] }, 1, 0] }
//           },
//           pendingCalls: {
//             $sum: {
//               $cond: [
//                 { $or: [{ $eq: ["$callingStatus", null] }, { $eq: ["$callingStatus", ""] }] },
//                 1,
//                 0
//               ]
//             }
//           }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           districtId: "$_id.districtId",
//           blockId: "$_id.blockId",
//           totalCallsAssigned: 1,
//           connectedCalls: 1,
//           notConnectedCalls: 1,
//           pendingCalls: 1
//         }
//       },
//       { $sort: { districtId: 1, blockId: 1 } }
//     ]);

//     console.log('=== CALL STATS AGGREGATE RESULT ===', callStatsAggregate.length, 'records');

//     // Combine both results and map assigned users
//     const combinedResult = schoolAggregate.map(schoolItem => {
//       const callStats = callStatsAggregate.find(
//         callItem =>
//           callItem.districtId === schoolItem.districtId &&
//           callItem.blockId === schoolItem.blockId
//       );

//       // Find assigned users for this district-block combination
//       let assignedCallers = [];
//       if (userDesignation) {
//         if (callMadeTo === "BEO") {
//           // For BEO, match by district only
//           assignedCallers = assignedUsers.filter(user => 
//             user.districtId === schoolItem.districtId
//           );
//         } else {
//           // For Principal and ABRC, match by district and block
//           assignedCallers = assignedUsers.filter(user => 
//             user.districtId === schoolItem.districtId && 
//             user.blockId === schoolItem.blockId
//           );
//         }
//       }

//       // Remove duplicates and format caller info
//       const uniqueCallers = Array.from(new Set(assignedCallers.map(user => user._id.toString())))
//         .map(id => {
//           const user = assignedCallers.find(u => u._id.toString() === id);
//           return {
//             userId: user._id,
//             userName: user.userName,
//             designation: user.designation,
//             mobile: user.mobile
//           };
//         });

//       return {
//         districtId: schoolItem.districtId,
//         districtName: schoolItem.districtName,
//         blockId: schoolItem.blockId,
//         blockName: schoolItem.blockName,
//         assignedCallers: uniqueCallers.length > 0 ? uniqueCallers : [{ userName: "No caller assigned", designation: "", mobile: "" }],
//         summary: {
//           totalPersons: schoolItem.totalCount,
//           uniqueContacts: schoolItem.uniqueContactCount,
//           calls: {
//             totalAssigned: callStats?.totalCallsAssigned || 0,
//             connected: callStats?.connectedCalls || 0,
//             notConnected: callStats?.notConnectedCalls || 0,
//             pending: callStats?.pendingCalls || 0
//           }
//         }
//       };
//     });

//     console.log('=== COMBINED RESULT ===', combinedResult);

//     // Calculate overall totals
//     const overallTotals = {
//       totalPersons: combinedResult.reduce((sum, item) => sum + item.summary.totalPersons, 0),
//       uniqueContacts: combinedResult.reduce((sum, item) => sum + item.summary.uniqueContacts, 0),
//       totalAssigned: combinedResult.reduce((sum, item) => sum + item.summary.calls.totalAssigned, 0),
//       connected: combinedResult.reduce((sum, item) => sum + item.summary.calls.connected, 0),
//       notConnected: combinedResult.reduce((sum, item) => sum + item.summary.calls.notConnected, 0),
//       pending: combinedResult.reduce((sum, item) => sum + item.summary.calls.pending, 0)
//     };

//     res.status(200).json({
//       success: true,
//       data: {
//         callMadeTo,
//         dateRange: {
//           startDate: startDate || "Not specified",
//           endDate: endDate || "Not specified"
//         },
//         filters: {
//           districtId: districtId || "All",
//           blockId: blockId || "All"
//         },
//         summaryByDistrictBlock: combinedResult,
//         overallSummary: overallTotals
//       }
//     });

//   } catch (error) {
//     console.error("Error in getCallSummary:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };
                                             
                                   
                                              
                      
                                               
                      
                                                
export const getCallSummary = async (req, res) => {
  try {
    const { callMadeTo, startDate, endDate, districtId, blockId } = req.body;

    console.log('=== REQUEST BODY ===', req.body);

    // Validate required field
    if (!callMadeTo) {
      return res.status(400).json({
        success: false,
        message: "callMadeTo is required in request body"
      });
    }

    // Validate callMadeTo value
    const validCallMadeTo = ["Principal", "ABRC", "BEO", "DEO"];
    if (!validCallMadeTo.includes(callMadeTo)) {
      return res.status(400).json({
        success: false,
        message: "callMadeTo must be one of: Principal, ABRC, BEO, DEO"
      });
    }

    // Build location filter
    const locationFilter = {};
    if (districtId) locationFilter.districtId = districtId;
    if (blockId) locationFilter.blockId = blockId;

    console.log('=== LOCATION FILTER ===', locationFilter);

    // DEBUG: First check ALL schools without contact filter
    const allSchools = await District_Block_School.find(locationFilter).limit(5);
    console.log('=== ALL SCHOOLS SAMPLE ===', allSchools.length);
    allSchools.forEach(school => {
      console.log(`School: ${school.centerName}, District: ${school.districtId}, Block: ${school.blockId}`);
      console.log(`Principal: ${school.principal}, Contact: ${school.principalContact}`);
      console.log(`ABRC: ${school.abrc}, Contact: ${school.abrcContact}`);
      console.log(`BEO: ${school.beo}, Contact: ${school.beoContact}`);
      console.log(`DEO: ${school.deo}, Contact: ${school.deoContact}`);
      console.log('---');
    });

    // FIXED: Use proper field names based on your actual data structure
    let contactField, nameField;
    
    switch(callMadeTo) {
      case "Principal":
        contactField = "princiaplContact"; // Note: Your data has typo "princiaplContact"
        nameField = "principal";
        break;
      case "ABRC":
        contactField = "abrcContact";
        nameField = "abrc";
        break;
      case "BEO":
        contactField = "beoContact";
        nameField = "beo";
        break;
      case "DEO":
        contactField = "deoContact";
        nameField = "deo";
        break;
    }

    console.log(`=== USING FIELDS === Contact: ${contactField}, Name: ${nameField}`);

    // FIXED: Check schools with the correct contact field
    const schoolMatchFilter = {
      ...locationFilter,
      [contactField]: { $exists: true, $ne: null, $ne: "" }
    };

    console.log('=== SCHOOL MATCH FILTER ===', schoolMatchFilter);

    const debugSchools = await District_Block_School.find(schoolMatchFilter).limit(5);
    console.log('=== DEBUG SCHOOLS FOUND ===', debugSchools.length);
    debugSchools.forEach(school => {
      console.log(`School: ${school.centerName}, District: ${school.districtId}, Block: ${school.blockId}`);
      console.log(`Contact: ${school[contactField]}, Name: ${school[nameField]}`);
    });

    // Get user data based on callMadeTo type
    let userDesignation, userAccessFilter;
    
    if (callMadeTo === "Principal" || callMadeTo === "ABRC") {
      userDesignation = "Center Coordinator";
    } else if (callMadeTo === "BEO") {
      userDesignation = "ACI";
    }

    console.log(`=== USER CONFIG === Designation: ${userDesignation}`);

    // Get users with their access data
    let assignedUsers = [];
    if (userDesignation) {
      assignedUsers = await User.aggregate([
        {
          $match: { designation: userDesignation }
        },
        {
          $lookup: {
            from: "useraccesses",
            localField: "_id",
            foreignField: "unqUserObjectId",
            as: "accessData"
          }
        },
        {
          $unwind: {
            path: "$accessData",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: "$accessData.region",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: "$accessData.region.blockIds",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            userName: 1,
            designation: 1,
            mobile: 1,
            districtId: "$accessData.region.districtId",
            blockId: "$accessData.region.blockIds.blockId"
          }
        }
      ]);

      console.log(`=== ASSIGNED USERS FOUND ===`, assignedUsers.length);
      console.log('Sample assigned users:', assignedUsers.slice(0, 3));
    }

    // Get counts from District_Block_School collection - FIXED FIELD NAMES
    const schoolAggregate = await District_Block_School.aggregate([
      {
        $match: schoolMatchFilter
      },
      {
        $group: {
          _id: {
            districtId: "$districtId",
            districtName: "$districtName",
            blockId: "$blockId",
            blockName: "$blockName"
          },
          totalCount: { $sum: 1 },
          uniqueContacts: {
            $addToSet: `$${contactField}`
          }
        }
      },
      {
        $project: {
          _id: 0,
          districtId: "$_id.districtId",
          districtName: "$_id.districtName",
          blockId: "$_id.blockId",
          blockName: "$_id.blockName",
          totalCount: 1,
          uniqueContactCount: { $size: "$uniqueContacts" }
        }
      },
      { $sort: { districtId: 1, blockId: 1 } }
    ]);

    console.log('=== SCHOOL AGGREGATE RESULT ===', schoolAggregate);

    // Get call statistics from CallLeads collection
    const callMatchFilter = {
      callMadeTo: callMadeTo,
      ...locationFilter,
      isActive: true
    };

    if (startDate || endDate) {
      callMatchFilter.callingDate = {};
      if (startDate) callMatchFilter.callingDate.$gte = new Date(startDate);
      if (endDate) callMatchFilter.callingDate.$lte = new Date(endDate);
    }

    const callStatsAggregate = await CallLeads.aggregate([
      {
        $match: callMatchFilter
      },
      {
        $group: {
          _id: {
            districtId: "$districtId",
            blockId: "$blockId"
          },
          totalCallsAssigned: { $sum: 1 },
          connectedCalls: {
            $sum: { $cond: [{ $eq: ["$callingStatus", "Connected"] }, 1, 0] }
          },
          notConnectedCalls: {
            $sum: { $cond: [{ $eq: ["$callingStatus", "Not connected"] }, 1, 0] }
          },
          pendingCalls: {
            $sum: {
              $cond: [
                { $or: [{ $eq: ["$callingStatus", null] }, { $eq: ["$callingStatus", ""] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          districtId: "$_id.districtId",
          blockId: "$_id.blockId",
          totalCallsAssigned: 1,
          connectedCalls: 1,
          notConnectedCalls: 1,
          pendingCalls: 1
        }
      },
      { $sort: { districtId: 1, blockId: 1 } }
    ]);

    console.log('=== CALL STATS AGGREGATE RESULT ===', callStatsAggregate.length, 'records');

    // Combine both results and map assigned users
    const combinedResult = schoolAggregate.map(schoolItem => {
      const callStats = callStatsAggregate.find(
        callItem =>
          callItem.districtId === schoolItem.districtId &&
          callItem.blockId === schoolItem.blockId
      );

      // Find assigned users for this district-block combination
      let assignedCallers = [];
      if (userDesignation) {
        if (callMadeTo === "BEO") {
          // For BEO, match by district only - show all ACI users for this district
          assignedCallers = assignedUsers.filter(user => 
            user.districtId === schoolItem.districtId
          );
        } else {
          // For Principal and ABRC, match by district and block - show Center Coordinators for this specific block
          assignedCallers = assignedUsers.filter(user => 
            user.districtId === schoolItem.districtId && 
            user.blockId === schoolItem.blockId
          );
        }
      }

      // Remove duplicates and format caller info
      const uniqueCallers = Array.from(new Set(assignedCallers.map(user => user._id.toString())))
        .map(id => {
          const user = assignedCallers.find(u => u._id.toString() === id);
          return {
            userId: user._id,
            userName: user.userName,
            designation: user.designation,
            mobile: user.mobile
          };
        });

      return {
        districtId: schoolItem.districtId,
        districtName: schoolItem.districtName,
        blockId: schoolItem.blockId,
        blockName: schoolItem.blockName,
        assignedCallers: uniqueCallers.length > 0 ? uniqueCallers : [{ userName: "No caller assigned", designation: "", mobile: "" }],
        summary: {
          totalPersons: schoolItem.totalCount,
          uniqueContacts: schoolItem.uniqueContactCount,
          calls: {
            totalAssigned: callStats?.totalCallsAssigned || 0,
            connected: callStats?.connectedCalls || 0,
            notConnected: callStats?.notConnectedCalls || 0,
            pending: callStats?.pendingCalls || 0
          }
        }
      };
    });

    console.log('=== COMBINED RESULT ===', combinedResult);

    // Calculate overall totals
    const overallTotals = {
      totalPersons: combinedResult.reduce((sum, item) => sum + item.summary.totalPersons, 0),
      uniqueContacts: combinedResult.reduce((sum, item) => sum + item.summary.uniqueContacts, 0),
      totalAssigned: combinedResult.reduce((sum, item) => sum + item.summary.calls.totalAssigned, 0),
      connected: combinedResult.reduce((sum, item) => sum + item.summary.calls.connected, 0),
      notConnected: combinedResult.reduce((sum, item) => sum + item.summary.calls.notConnected, 0),
      pending: combinedResult.reduce((sum, item) => sum + item.summary.calls.pending, 0)
    };

    res.status(200).json({
      success: true,
      data: {
        callMadeTo,
        dateRange: {
          startDate: startDate || "Not specified",
          endDate: endDate || "Not specified"
        },
        filters: {
          districtId: districtId || "All",
          blockId: blockId || "All"
        },
        summaryByDistrictBlock: combinedResult,
        overallSummary: overallTotals
      }
    });

  } catch (error) {
    console.error("Error in getCallSummary:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};





































//Verification dashboard



export const getVerificationSummary = async (req, res) => {
    try {
        const pipeline = [
            {
                $match: {
                    isBulkRegistered: false,
                    isVerified: { $nin: ["", null] }
                }
            },
            {
                $facet: {
                    // District-wise summary
                    districtSummary: [
                        {
                            $group: {
                                _id: "$schoolDistrict",
                                verified: {
                                    $sum: { $cond: [{ $eq: ["$isVerified", "Verified"] }, 1, 0] }
                                },
                                pending: {
                                    $sum: { $cond: [{ $eq: ["$isVerified", "Pending"] }, 1, 0] }
                                },
                                rejected: {
                                    $sum: { $cond: [{ $eq: ["$isVerified", "Rejected"] }, 1, 0] }
                                },
                                total: { $sum: 1 }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                district: "$_id",
                                verified: 1,
                                pending: 1,
                                rejected: 1,
                                total: 1
                            }
                        },
                        { $sort: { district: 1 } }
                    ],
                    // Overall totals
                    overallSummary: [
                        {
                            $group: {
                                _id: null,
                                totalVerified: {
                                    $sum: { $cond: [{ $eq: ["$isVerified", "Verified"] }, 1, 0] }
                                },
                                totalPending: {
                                    $sum: { $cond: [{ $eq: ["$isVerified", "Pending"] }, 1, 0] }
                                },
                                totalRejected: {
                                    $sum: { $cond: [{ $eq: ["$isVerified", "Rejected"] }, 1, 0] }
                                },
                                totalStudents: { $sum: 1 }
                            }
                        }
                    ]
                }
            }
        ];

        const [result] = await Student.aggregate(pipeline);

        const response = {
            success: true,
            overallSummary: result.overallSummary[0] || {
                totalVerified: 0,
                totalPending: 0,
                totalRejected: 0,
                totalStudents: 0
            },
            districtWiseSummary: result.districtSummary,
            totalDistricts: result.districtSummary.length
        };

        // Remove _id from overall summary
        delete response.overallSummary._id;

        res.status(200).json(response);

    } catch (error) {
        console.error("Error in detailed verification summary:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};