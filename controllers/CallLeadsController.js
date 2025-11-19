import mongoose from "mongoose";

import { CallLeads } from "../models/CallLeadsModel.js";
import { District_Block_School } from "../models/District_block_schoolsModel.js";
import { User } from "../models/UserModel.js";
import { UserAccess } from "../models/UserModel.js";


// export const CreateCallLeads = async (req, res) => {

// console.log('hello call leads')

//     const {callMadeTo} = req.body


//     console.log(callMadeTo)

//     let dataTobeInitiated = [];

   
// let regionIdsWithCallerIds = []



//     try {


//         const userResponse = await User.find({designation: "Center Coordinator"})



        
        
//          if (callMadeTo === "Principal"){

//         const response = await District_Block_School.find({ principal: { $nin: ["", null] },})

      
//             for (let i = 0; i < userResponse.length; i++) {


//                 console.log(userResponse[i]._id)

//                 const accessResponse = await UserAccess.find({unqUserObjectId:userResponse[i]._id})

//                 console.log(accessResponse)

//                 regionIdsWithCallerIds.push(accessResponse[0].region)
//     // your code
// }
          
        
//         res.status(200).json({status:"oK", data: regionIdsWithCallerIds,})
//     } 

//     } catch (error) {
        
//     }


// }







// export const CreatePrincipalCallLeads = async (req, res) => {
//   try {
//     // 1) aggregate join (same as before) to get matched rows (may be many per school)
//     const joined = await District_Block_School.aggregate([
//       { $match: { princiaplContact: { $nin: [null, ""] } } },

//       {
//         $lookup: {
//           from: "useraccesses",
//           let: { schoolBlockId: "$blockId" },
//           pipeline: [
//             { $unwind: { path: "$region", preserveNullAndEmptyArrays: true } },
//             { $unwind: { path: "$region.blockIds", preserveNullAndEmptyArrays: true } },
//             {
//               $match: {
//                 $expr: { $eq: ["$region.blockIds.blockId", "$$schoolBlockId"] }
//               }
//             },
//             { $project: { unqUserObjectId: 1, region: 1 } }
//           ],
//           as: "matchedUserAccesses"
//         }
//       },

//       { $unwind: { path: "$matchedUserAccesses", preserveNullAndEmptyArrays: true } },

//       {
//         $lookup: {
//           from: "users",
//           localField: "matchedUserAccesses.unqUserObjectId",
//           foreignField: "_id",
//           as: "callerUser"
//         }
//       },

//       { $unwind: { path: "$callerUser", preserveNullAndEmptyArrays: true } },

//       {
//         $project: {
//           _id: 1,
//           districtId: 1,
//           districtName: 1,
//           blockId: 1,
//           blockName: 1,
//           centerId: 1,
//           centerName: 1,
//           principal: 1,
//           princiaplContact: 1,
//           matchedUserAccesses: 1,
//           callerUser: 1
//         }
//       }
//     ]);

//     // 2) Keep the first row per school (so one lead per school). For each first row,
//     //    use callerUser only if callerUser.designation === "Center Coordinator".
//     const firstBySchool = new Map();
//     for (const row of joined) {
//       const schoolIdStr = String(row._id);
//       if (!firstBySchool.has(schoolIdStr)) {
//         firstBySchool.set(schoolIdStr, row);
//       }
//     }

//     // 3) Build candidate docs — include those with null caller (when no CC found)
//     const candidateDocs = [];
//     const nullCallerList = [];
//     const skippedNoSchoolId = [];

//     for (const [schoolIdStr, row] of firstBySchool.entries()) {
//       // ensure we have a school _id
//       if (!row._id) {
//         skippedNoSchoolId.push({ centerName: row.centerName || null });
//         continue;
//       }

//       // choose caller only if designation === "Center Coordinator"
//       let callerUser = null;
//       if (row.callerUser && row.callerUser.designation === "Center Coordinator" && row.callerUser._id) {
//         callerUser = row.callerUser;
//       } else {
//         // even if callerUser exists but not Center Coordinator, we treat as no caller
//         callerUser = null;
//       }

//       // convert called person id safely
//       let objectIdOfCalledPerson = null;
//       try {
//         objectIdOfCalledPerson =
//           row._id instanceof mongoose.Types.ObjectId ? row._id : new mongoose.Types.ObjectId(String(row._id));
//       } catch (e) {
//         objectIdOfCalledPerson = null;
//       }

//       // convert caller id if present
//       let objectIdOfCaller = null;
//       if (callerUser && callerUser._id) {
//         try {
//           objectIdOfCaller =
//             callerUser._id instanceof mongoose.Types.ObjectId
//               ? callerUser._id
//               : new mongoose.Types.ObjectId(String(callerUser._id));
//         } catch (e) {
//           objectIdOfCaller = null;
//         }
//       } else {
//         objectIdOfCaller = null; // explicit null when no CC caller found
//       }

//       if (!objectIdOfCalledPerson) {
//         skippedNoSchoolId.push({ centerName: row.centerName || null });
//         continue;
//       }

//       if (!objectIdOfCaller) {
//         nullCallerList.push({ schoolId: objectIdOfCalledPerson, centerName: row.centerName || null });
//       }

//       candidateDocs.push({
//         objectIdOfCalledPerson,
//         objectIdOfCaller, // may be null
//         callMadeTo: "Principal",
//         districtId: row.districtId || null,
//         blockId: row.blockId || null,
//         centerId: row.centerId || null,
//         callType: null,
//         callingStatus: null,
//         callingRemark1: null,
//         callingRemark2: null,
//         mannualRemark: null,
//         callingDate: new Date()
//       });
//     }

//     // 4) Remove existing leads for same objectIdOfCalledPerson & callMadeTo:"Principal" (avoid duplicates across runs)
//     const calledIds = candidateDocs.map((c) => c.objectIdOfCalledPerson).filter(Boolean);
//     const existing = await CallLeads.find(
//       { objectIdOfCalledPerson: { $in: calledIds }, callMadeTo: "Principal" },
//       { objectIdOfCalledPerson: 1 }
//     ).lean();
//     const existingSet = new Set((existing || []).map((e) => String(e.objectIdOfCalledPerson)));

//     const toInsert = candidateDocs.filter((c) => !existingSet.has(String(c.objectIdOfCalledPerson)));

//     // 5) Prepare stats
//     const stats = {
//       totalJoinedRows: joined.length,
//       uniqueSchoolsFound: firstBySchool.size,
//       candidateCount: candidateDocs.length,
//       nullCallerCount: candidateDocs.filter((c) => c.objectIdOfCaller == null).length,
//       skippedDueToMissingSchoolId: skippedNoSchoolId.length,
//       alreadyExistingSkipped: calledIds.length - toInsert.length,
//       toInsertCount: toInsert.length
//     };

//     if (toInsert.length === 0) {
//       return res.status(200).json({
//         status: "oK",
//         message: "No Principal leads to insert (all already exist or missing school id).",
//         stats
//       });
//     }

//     // 6) Insert using raw collection API to allow null objectIdOfCaller (bypasses Mongoose validation)
//     let inserted = [];
//     try {
//       const insertResult = await CallLeads.collection.insertMany(
//         toInsert.map((d) => ({
//           ...d,
//           objectIdOfCalledPerson: d.objectIdOfCalledPerson ? d.objectIdOfCalledPerson : null,
//           objectIdOfCaller: d.objectIdOfCaller ? d.objectIdOfCaller : null,
//           createdAt: new Date(),
//           updatedAt: new Date()
//         })),
//         { ordered: false }
//       );

//       // build inserted array minimal info
//       if (insertResult && insertResult.insertedCount) {
//         inserted = Object.values(insertResult.insertedIds).map((id) => ({ _id: id }));
//       }
//     } catch (insertErr) {
//       // salvage partial inserts if possible
//       if (insertErr && insertErr.result && insertErr.result.insertedIds) {
//         const ids = Object.values(insertErr.result.insertedIds);
//         inserted = ids.map((id) => ({ _id: id }));
//       } else {
//         console.error("Insert error (raw collection):", insertErr);
//       }

//       const writeErrors = insertErr && insertErr.writeErrors ? insertErr.writeErrors.map((we) => ({ index: we.index, errmsg: we.errmsg })) : null;
//       return res.status(500).json({
//         status: "error",
//         message: "Some Principal leads failed to insert (raw collection).",
//         stats,
//         attemptedToInsert: toInsert.length,
//         insertedCount: Array.isArray(inserted) ? inserted.length : 0,
//         inserted,
//         writeErrors
//       });
//     }

//     // 7) success response
//     return res.status(200).json({
//       status: "oK",
//       message: "Principal leads created (caller only set when designation is Center Coordinator; otherwise null).",
//       stats,
//       created: Array.isArray(inserted) ? inserted.length : 0,
//       inserted,
//       nullCallerSample: nullCallerList.slice(0, 10) // include a small sample for debug
//     });
//   } catch (error) {
//     console.error("CreatePrincipalCallLeads error:", error);
//     return res.status(500).json({ status: "error", message: error.message || "Server error" });
//   }
// };



















export const CreatePrincipalCallLeads = async (req, res) => {
  try {
    // 1) aggregate join (same as before) to get matched rows (may be many per school)
    const joined = await District_Block_School.aggregate([
      { $match: { princiaplContact: { $nin: [null, ""] } } },

      {
        $lookup: {
          from: "useraccesses",
          let: { schoolBlockId: "$blockId" },
          pipeline: [
            { $unwind: { path: "$region", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$region.blockIds", preserveNullAndEmptyArrays: true } },
            {
              $match: {
                $expr: { $eq: ["$region.blockIds.blockId", "$$schoolBlockId"] }
              }
            },
            { $project: { unqUserObjectId: 1, region: 1 } }
          ],
          as: "matchedUserAccesses"
        }
      },

      { $unwind: { path: "$matchedUserAccesses", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "users",
          localField: "matchedUserAccesses.unqUserObjectId",
          foreignField: "_id",
          as: "callerUser"
        }
      },

      { $unwind: { path: "$callerUser", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 1,
          districtId: 1,
          districtName: 1,
          blockId: 1,
          blockName: 1,
          centerId: 1,
          centerName: 1,
          principal: 1,
          princiaplContact: 1,
          matchedUserAccesses: 1,
          callerUser: 1
        }
      }
    ]);

    // 2) Keep the first row per school (so one lead per school). For each first row,
    //    use callerUser only if callerUser.designation === "Center Coordinator".
    const firstBySchool = new Map();
    for (const row of joined) {
      const schoolIdStr = String(row._id);
      if (!firstBySchool.has(schoolIdStr)) {
        firstBySchool.set(schoolIdStr, row);
      }
    }

    // 3) Build candidate docs — include those with null caller (when no CC found)
    const candidateDocs = [];
    const nullCallerList = [];
    const skippedNoSchoolId = [];

    for (const [schoolIdStr, row] of firstBySchool.entries()) {
      // ensure we have a school _id
      if (!row._id) {
        skippedNoSchoolId.push({ centerName: row.centerName || null });
        continue;
      }

      // choose caller only if designation === "Center Coordinator"
      let callerUser = null;
      if (row.callerUser && row.callerUser.designation === "Center Coordinator" && row.callerUser._id) {
        callerUser = row.callerUser;
      } else {
        // even if callerUser exists but not Center Coordinator, we treat as no caller
        callerUser = null;
      }

      // convert called person id safely
      let objectIdOfCalledPerson = null;
      try {
        objectIdOfCalledPerson =
          row._id instanceof mongoose.Types.ObjectId ? row._id : new mongoose.Types.ObjectId(String(row._id));
      } catch (e) {
        objectIdOfCalledPerson = null;
      }

      // convert caller id if present
      let objectIdOfCaller = null;
      if (callerUser && callerUser._id) {
        try {
          objectIdOfCaller =
            callerUser._id instanceof mongoose.Types.ObjectId
              ? callerUser._id
              : new mongoose.Types.ObjectId(String(callerUser._id));
        } catch (e) {
          objectIdOfCaller = null;
        }
      } else {
        objectIdOfCaller = null; // explicit null when no CC caller found
      }

      if (!objectIdOfCalledPerson) {
        skippedNoSchoolId.push({ centerName: row.centerName || null });
        continue;
      }

      if (!objectIdOfCaller) {
        nullCallerList.push({ schoolId: objectIdOfCalledPerson, centerName: row.centerName || null });
      }

      candidateDocs.push({
        objectIdOfCalledPerson,
        objectIdOfCaller, // may be null
        callMadeTo: "Principal",
        districtId: row.districtId || null,
        blockId: row.blockId || null,
        centerId: row.centerId || null,
        callType: null,
        callingStatus: null,
        callingRemark1: null,
        callingRemark2: null,
        mannualRemark: null,
        callingDate: new Date()
      });
    }

    // 4) Remove existing leads for same objectIdOfCalledPerson & callMadeTo:"Principal" (avoid duplicates across runs)
    const toInsert = candidateDocs;

    // 5) Prepare stats
    const stats = {
      totalJoinedRows: joined.length,
      uniqueSchoolsFound: firstBySchool.size,
      candidateCount: candidateDocs.length,
      nullCallerCount: candidateDocs.filter((c) => c.objectIdOfCaller == null).length,
      skippedDueToMissingSchoolId: skippedNoSchoolId.length,
      toInsertCount: toInsert.length
    };

    if (toInsert.length === 0) {
      return res.status(200).json({
        status: "oK",
        message: "No Principal leads to insert (all already exist or missing school id).",
        stats
      });
    }

    // 6) Insert using raw collection API to allow null objectIdOfCaller (bypasses Mongoose validation)
    let inserted = [];
    try {
      const insertResult = await CallLeads.collection.insertMany(
        toInsert.map((d) => ({
          ...d,
          objectIdOfCalledPerson: d.objectIdOfCalledPerson ? d.objectIdOfCalledPerson : null,
          objectIdOfCaller: d.objectIdOfCaller ? d.objectIdOfCaller : null,
          createdAt: new Date(),
          updatedAt: new Date()
        })),
        { ordered: false }
      );

      // build inserted array minimal info
      if (insertResult && insertResult.insertedCount) {
        inserted = Object.values(insertResult.insertedIds).map((id) => ({ _id: id }));
      }
    } catch (insertErr) {
      // salvage partial inserts if possible
      if (insertErr && insertErr.result && insertErr.result.insertedIds) {
        const ids = Object.values(insertErr.result.insertedIds);
        inserted = ids.map((id) => ({ _id: id }));
      } else {
        console.error("Insert error (raw collection):", insertErr);
      }

      const writeErrors = insertErr && insertErr.writeErrors ? insertErr.writeErrors.map((we) => ({ index: we.index, errmsg: we.errmsg })) : null;
      return res.status(500).json({
        status: "error",
        message: "Some Principal leads failed to insert (raw collection).",
        stats,
        attemptedToInsert: toInsert.length,
        insertedCount: Array.isArray(inserted) ? inserted.length : 0,
        inserted,
        writeErrors
      });
    }

    // 7) success response
    return res.status(200).json({
      status: "oK",
      message: "Principal leads created (caller only set when designation is Center Coordinator; otherwise null).",
      stats,
      created: Array.isArray(inserted) ? inserted.length : 0,
      inserted,
      nullCallerSample: nullCallerList.slice(0, 10) // include a small sample for debug
    });
  } catch (error) {
    console.error("CreatePrincipalCallLeads error:", error);
    return res.status(500).json({ status: "error", message: error.message || "Server error" });
  }
};






// export const CreateABRCLeads = async (req, res) => {
//   try {
//     // 1) unique ABRC list (trimmed, prefer isCluster:true)
//     const uniqueAbrc = await District_Block_School.aggregate([
//       {
//         $addFields: {
//           abrcContactTrimmed: {
//             $trim: { input: { $ifNull: ["$abrcContact", ""] } }
//           }
//         }
//       },
//       { $match: { abrcContactTrimmed: { $nin: [null, ""] } } },
//       { $sort: { abrcContactTrimmed: 1, isCluster: -1, updatedAt: -1 } },
//       {
//         $group: {
//           _id: "$abrcContactTrimmed",
//           docId: { $first: "$_id" },
//           abrc: { $first: "$abrc" },
//           abrcContact: { $first: "$abrcContactTrimmed" },
//           isCluster: { $first: "$isCluster" },
//           districtId: { $first: "$districtId" },
//           blockId: { $first: "$blockId" },
//           centerId: { $first: "$centerId" },
//           centerName: { $first: "$centerName" }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           abrcContactKey: "$_id",
//           docId: 1,
//           abrc: 1,
//           abrcContact: 1,
//           isCluster: 1,
//           districtId: 1,
//           blockId: 1,
//           centerId: 1,
//           centerName: 1
//         }
//       }
//     ]);

//     const uniqueCount = uniqueAbrc.length;
//     if (uniqueCount === 0) {
//       return res.status(200).json({
//         status: "oK",
//         message: "No unique ABRC contacts found (non-empty).",
//         uniqueAbrcCount: 0,
//         created: 0,
//         inserted: []
//       });
//     }

//     // 2) For each unique ABRC, find one caller (if any), build doc (caller may be null)
//     const CONCURRENCY = 50;
//     const chunks = [];
//     for (let i = 0; i < uniqueAbrc.length; i += CONCURRENCY) {
//       chunks.push(uniqueAbrc.slice(i, i + CONCURRENCY));
//     }

//     const candidateDocs = [];
//     const skippedNoDocId = [];
//     let nullCallerCount = 0;
//     let rejectedCallerByDesignation = 0;

//     for (const chunk of chunks) {
//       const promises = chunk.map(async (rep) => {
//         // require docId and blockId; if missing, skip
//         if (!rep.docId || !rep.blockId) {
//           skippedNoDocId.push({ abrcContact: rep.abrcContact, docId: rep.docId, blockId: rep.blockId });
//           return null;
//         }

//         // Try to find a UserAccess for blockId
//         const ua = await UserAccess.findOne({ "region.blockIds.blockId": rep.blockId }, { unqUserObjectId: 1 }).lean();

//         let callerUser = null;
//         if (ua && ua.unqUserObjectId) {
//           const foundUser = await User.findOne({ _id: ua.unqUserObjectId }).lean();
//           // accept only if designation === "Center Coordinator"
//           if (foundUser && foundUser.designation === "Center Coordinator") {
//             callerUser = foundUser;
//           } else {
//             // user found but not a Center Coordinator -> reject as caller
//             rejectedCallerByDesignation++;
//             callerUser = null;
//           }
//         }

//         // convert docId to ObjectId (school id)
//         let objectIdOfCalledPerson = null;
//         try {
//           objectIdOfCalledPerson =
//             rep.docId instanceof mongoose.Types.ObjectId ? rep.docId : new mongoose.Types.ObjectId(String(rep.docId));
//         } catch (e) {
//           objectIdOfCalledPerson = null;
//         }

//         // convert caller id if available, else null
//         let objectIdOfCaller = null;
//         if (callerUser && callerUser._id) {
//           try {
//             objectIdOfCaller =
//               callerUser._id instanceof mongoose.Types.ObjectId
//                 ? callerUser._id
//                 : new mongoose.Types.ObjectId(String(callerUser._id));
//           } catch (e) {
//             objectIdOfCaller = null;
//           }
//         } else {
//           objectIdOfCaller = null; // explicit null when no (valid) caller found
//         }

//         // build doc (objectIdOfCaller may be null)
//         if (!objectIdOfCalledPerson) {
//           // skip if called person id can't be resolved
//           skippedNoDocId.push({ abrcContact: rep.abrcContact, docId: rep.docId, blockId: rep.blockId });
//           return null;
//         }

//         if (!objectIdOfCaller) nullCallerCount++;

//         const doc = {
//           objectIdOfCalledPerson,
//           objectIdOfCaller, // possibly null
//           callMadeTo: "ABRC",
//           districtId: rep.districtId || null,
//           blockId: rep.blockId || null,
//           centerId: rep.centerId || null,
//           callType: null,
//           callingStatus: null,
//           callingRemark1: null,
//           callingRemark2: null,
//           mannualRemark: null,
//           callingDate: new Date()
//         };

//         return doc;
//       });

//       const results = await Promise.all(promises);
//       results.forEach((r) => {
//         if (r) candidateDocs.push(r);
//       });
//     }

//     // 3) Remove those already present (objectIdOfCalledPerson + callMadeTo:"ABRC"), to avoid duplicates
//     const calledIds = candidateDocs.map((c) => c.objectIdOfCalledPerson).filter(Boolean);
//     const existing = await CallLeads.find(
//       { objectIdOfCalledPerson: { $in: calledIds }, callMadeTo: "ABRC" },
//       { objectIdOfCalledPerson: 1 }
//     ).lean();
//     const existingSet = new Set((existing || []).map((e) => String(e.objectIdOfCalledPerson)));

//     const toInsert = candidateDocs.filter((c) => !existingSet.has(String(c.objectIdOfCalledPerson)));

//     const stats = {
//       uniqueAbrcCount: uniqueCount,
//       candidateCount: candidateDocs.length,
//       toInsertCount: toInsert.length,
//       skippedDueToMissingDocId: skippedNoDocId.length,
//       nullCallerCount: candidateDocs.filter((c) => c.objectIdOfCaller == null).length,
//       rejectedCallerByDesignation
//     };

//     if (toInsert.length === 0) {
//       return res.status(200).json({
//         status: "oK",
//         message: "No ABRC leads to insert (either already exist or missing docId).",
//         stats
//       });
//     }

//     // 4) Insert documents using raw collection API to allow null objectIdOfCaller (bypasses Mongoose validation)
//     let inserted = [];
//     try {
//       const insertResult = await CallLeads.collection.insertMany(
//         toInsert.map((d) => {
//           return {
//             ...d,
//             objectIdOfCalledPerson: d.objectIdOfCalledPerson ? d.objectIdOfCalledPerson : null,
//             objectIdOfCaller: d.objectIdOfCaller ? d.objectIdOfCaller : null,
//             createdAt: new Date(),
//             updatedAt: new Date()
//           };
//         }),
//         { ordered: false }
//       );

//       inserted = insertResult.insertedCount ? Object.values(insertResult.insertedIds).map((id) => ({ _id: id })) : [];
//     } catch (insertErr) {
//       if (insertErr && insertErr.result && insertErr.result.insertedIds) {
//         const ids = Object.values(insertErr.result.insertedIds);
//         inserted = ids.map((id) => ({ _id: id }));
//       } else {
//         console.error("Insert error (raw collection):", insertErr);
//       }

//       const writeErrors = insertErr && insertErr.writeErrors ? insertErr.writeErrors.map((we) => ({ index: we.index, errmsg: we.errmsg })) : null;

//       return res.status(500).json({
//         status: "error",
//         message: "Some ABRC leads failed to insert (raw collection insert).",
//         stats,
//         attemptedToInsert: toInsert.length,
//         insertedCount: Array.isArray(inserted) ? inserted.length : 0,
//         inserted,
//         writeErrors
//       });
//     }

//     // 5) success response
//     return res.status(200).json({
//       status: "oK",
//       message: "ABRC leads created (objectIdOfCaller may be null for some leads).",
//       stats,
//       created: Array.isArray(inserted) ? inserted.length : 0,
//       inserted
//     });
//   } catch (error) {
//     console.error("CreateABRCLeads error:", error);
//     return res.status(500).json({ status: "error", message: error.message || "Server error" });
//   }
// };







export const CreateABRCLeads = async (req, res) => {
  try {
    // 1) unique ABRC list (trimmed, prefer isCluster:true)
    const uniqueAbrc = await District_Block_School.aggregate([
      {
        $addFields: {
          abrcContactTrimmed: {
            $trim: { input: { $ifNull: ["$abrcContact", ""] } }
          }
        }
      },
      { $match: { abrcContactTrimmed: { $nin: [null, ""] } } },
      { $sort: { abrcContactTrimmed: 1, isCluster: -1, updatedAt: -1 } },
      {
        $group: {
          _id: "$abrcContactTrimmed",
          docId: { $first: "$_id" },
          abrc: { $first: "$abrc" },
          abrcContact: { $first: "$abrcContactTrimmed" },
          isCluster: { $first: "$isCluster" },
          districtId: { $first: "$districtId" },
          blockId: { $first: "$blockId" },
          centerId: { $first: "$centerId" },
          centerName: { $first: "$centerName" }
        }
      },
      {
        $project: {
          _id: 0,
          abrcContactKey: "$_id",
          docId: 1,
          abrc: 1,
          abrcContact: 1,
          isCluster: 1,
          districtId: 1,
          blockId: 1,
          centerId: 1,
          centerName: 1
        }
      }
    ]);

    const uniqueCount = uniqueAbrc.length;
    if (uniqueCount === 0) {
      return res.status(200).json({
        status: "oK",
        message: "No unique ABRC contacts found (non-empty).",
        uniqueAbrcCount: 0,
        created: 0,
        inserted: []
      });
    }

    // 2) For each unique ABRC, find one caller (if any), build doc (caller may be null)
    const CONCURRENCY = 50;
    const chunks = [];
    for (let i = 0; i < uniqueAbrc.length; i += CONCURRENCY) {
      chunks.push(uniqueAbrc.slice(i, i + CONCURRENCY));
    }

    const candidateDocs = [];
    const skippedNoDocId = [];
    let nullCallerCount = 0;
    let rejectedCallerByDesignation = 0;

    for (const chunk of chunks) {
      const promises = chunk.map(async (rep) => {
        // require docId and blockId; if missing, skip
        if (!rep.docId || !rep.blockId) {
          skippedNoDocId.push({ abrcContact: rep.abrcContact, docId: rep.docId, blockId: rep.blockId });
          return null;
        }

        // Try to find a UserAccess for blockId
        const ua = await UserAccess.findOne({ "region.blockIds.blockId": rep.blockId }, { unqUserObjectId: 1 }).lean();

        let callerUser = null;
        if (ua && ua.unqUserObjectId) {
          const foundUser = await User.findOne({ _id: ua.unqUserObjectId }).lean();
          // accept only if designation === "Center Coordinator"
          if (foundUser && foundUser.designation === "Center Coordinator") {
            callerUser = foundUser;
          } else {
            // user found but not a Center Coordinator -> reject as caller
            rejectedCallerByDesignation++;
            callerUser = null;
          }
        }

        // convert docId to ObjectId (school id)
        let objectIdOfCalledPerson = null;
        try {
          objectIdOfCalledPerson =
            rep.docId instanceof mongoose.Types.ObjectId ? rep.docId : new mongoose.Types.ObjectId(String(rep.docId));
        } catch (e) {
          objectIdOfCalledPerson = null;
        }

        // convert caller id if available, else null
        let objectIdOfCaller = null;
        if (callerUser && callerUser._id) {
          try {
            objectIdOfCaller =
              callerUser._id instanceof mongoose.Types.ObjectId
                ? callerUser._id
                : new mongoose.Types.ObjectId(String(callerUser._id));
          } catch (e) {
            objectIdOfCaller = null;
          }
        } else {
          objectIdOfCaller = null; // explicit null when no (valid) caller found
        }

        // build doc (objectIdOfCaller may be null)
        if (!objectIdOfCalledPerson) {
          // skip if called person id can't be resolved
          skippedNoDocId.push({ abrcContact: rep.abrcContact, docId: rep.docId, blockId: rep.blockId });
          return null;
        }

        if (!objectIdOfCaller) nullCallerCount++;

        const doc = {
          objectIdOfCalledPerson,
          objectIdOfCaller, // possibly null
          callMadeTo: "ABRC",
          districtId: rep.districtId || null,
          blockId: rep.blockId || null,
          centerId: rep.centerId || null,
          callType: null,
          callingStatus: null,
          callingRemark1: null,
          callingRemark2: null,
          mannualRemark: null,
          callingDate: new Date()
        };

        return doc;
      });

      const results = await Promise.all(promises);
      results.forEach((r) => {
        if (r) candidateDocs.push(r);
      });
    }

    // 3) Remove those already present (objectIdOfCalledPerson + callMadeTo:"ABRC"), to avoid duplicates
    const toInsert = candidateDocs;

    const stats = {
      uniqueAbrcCount: uniqueCount,
      candidateCount: candidateDocs.length,
      toInsertCount: toInsert.length,
      skippedDueToMissingDocId: skippedNoDocId.length,
      nullCallerCount: candidateDocs.filter((c) => c.objectIdOfCaller == null).length,
      rejectedCallerByDesignation
    };

    if (toInsert.length === 0) {
      return res.status(200).json({
        status: "oK",
        message: "No ABRC leads to insert (either already exist or missing docId).",
        stats
      });
    }

    // 4) Insert documents using raw collection API to allow null objectIdOfCaller (bypasses Mongoose validation)
    let inserted = [];
    try {
      const insertResult = await CallLeads.collection.insertMany(
        toInsert.map((d) => {
          return {
            ...d,
            objectIdOfCalledPerson: d.objectIdOfCalledPerson ? d.objectIdOfCalledPerson : null,
            objectIdOfCaller: d.objectIdOfCaller ? d.objectIdOfCaller : null,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }),
        { ordered: false }
      );

      inserted = insertResult.insertedCount ? Object.values(insertResult.insertedIds).map((id) => ({ _id: id })) : [];
    } catch (insertErr) {
      if (insertErr && insertErr.result && insertErr.result.insertedIds) {
        const ids = Object.values(insertErr.result.insertedIds);
        inserted = ids.map((id) => ({ _id: id }));
      } else {
        console.error("Insert error (raw collection):", insertErr);
      }

      const writeErrors = insertErr && insertErr.writeErrors ? insertErr.writeErrors.map((we) => ({ index: we.index, errmsg: we.errmsg })) : null;

      return res.status(500).json({
        status: "error",
        message: "Some ABRC leads failed to insert (raw collection insert).",
        stats,
        attemptedToInsert: toInsert.length,
        insertedCount: Array.isArray(inserted) ? inserted.length : 0,
        inserted,
        writeErrors
      });
    }

    // 5) success response
    return res.status(200).json({
      status: "oK",
      message: "ABRC leads created (objectIdOfCaller may be null for some leads).",
      stats,
      created: Array.isArray(inserted) ? inserted.length : 0,
      inserted
    });
  } catch (error) {
    console.error("CreateABRCLeads error:", error);
    return res.status(500).json({ status: "error", message: error.message || "Server error" });
  }
};






// export const CreateBeosLeads = async (req, res) => {

// console.log('hello beos call leads')

//   try {
//     // 1) unique BEO list (trimmed, prefer isCluster:true)
//     const uniqueBeo = await District_Block_School.aggregate([
//       {
//         $addFields: {
//           beoContactTrimmed: {
//             $trim: { input: { $ifNull: ["$beoContact", ""] } }
//           }
//         }
//       },
//       { $match: { beoContactTrimmed: { $nin: [null, ""] } } },
//       { $sort: { beoContactTrimmed: 1, isCluster: -1, updatedAt: -1 } },
//       {
//         $group: {
//           _id: "$beoContactTrimmed",
//           docId: { $first: "$_id" },
//           beo: { $first: "$beo" },
//           beoContact: { $first: "$beoContactTrimmed" },
//           isCluster: { $first: "$isCluster" },
//           districtId: { $first: "$districtId" },
//           blockId: { $first: "$blockId" },
//           blockName: { $first: "$blockName" }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           beoContactKey: "$_id",
//           docId: 1,
//           beo: 1,
//           beoContact: 1,
//           isCluster: 1,
//           districtId: 1,
//           blockId: 1,
//           blockName: 1
//         }
//       }
//     ]);

//     const uniqueCount = uniqueBeo.length;
//     if (uniqueCount === 0) {
//       return res.status(200).json({
//         status: "oK",
//         message: "No unique BEO contacts found (non-empty).",
//         uniqueBeoCount: 0,
//         created: 0,
//         inserted: []
//       });
//     }

//     // 2) For each unique BEO, find one caller (if any), build doc (caller may be null)
//     const CONCURRENCY = 50;
//     const chunks = [];
//     for (let i = 0; i < uniqueBeo.length; i += CONCURRENCY) {
//       chunks.push(uniqueBeo.slice(i, i + CONCURRENCY));
//     }

//     const candidateDocs = [];
//     const skippedNoDocId = [];
//     let nullCallerCount = 0;
//     let rejectedCallerByDesignation = 0;

//     for (const chunk of chunks) {
//       const promises = chunk.map(async (rep) => {
//         // require docId and blockId; if missing, skip
//         if (!rep.docId || !rep.blockId) {
//           skippedNoDocId.push({ beoContact: rep.beoContact, docId: rep.docId, blockId: rep.blockId });
//           return null;
//         }

//         // Try to find a UserAccess for blockId
//         const ua = await UserAccess.findOne({ "region.blockIds.blockId": rep.blockId }, { unqUserObjectId: 1 }).lean();

//         let callerUser = null;
//         if (ua && ua.unqUserObjectId) {
//           const foundUser = await User.findOne({ _id: ua.unqUserObjectId }).lean();
//           // accept only if designation === "ABRC"
//           if (foundUser && foundUser.designation === "ABRC") {
//             callerUser = foundUser;
//           } else {
//             // user found but not a ABRC -> reject as caller
//             rejectedCallerByDesignation++;
//             callerUser = null;
//           }
//         }

//         // convert docId to ObjectId (school id)
//         let objectIdOfCalledPerson = null;
//         try {
//           objectIdOfCalledPerson =
//             rep.docId instanceof mongoose.Types.ObjectId ? rep.docId : new mongoose.Types.ObjectId(String(rep.docId));
//         } catch (e) {
//           objectIdOfCalledPerson = null;
//         }

//         // convert caller id if available, else null
//         let objectIdOfCaller = null;
//         if (callerUser && callerUser._id) {
//           try {
//             objectIdOfCaller =
//               callerUser._id instanceof mongoose.Types.ObjectId
//                 ? callerUser._id
//                 : new mongoose.Types.ObjectId(String(callerUser._id));
//           } catch (e) {
//             objectIdOfCaller = null;
//           }
//         } else {
//           objectIdOfCaller = null; // explicit null when no (valid) caller found
//         }

//         // build doc (objectIdOfCaller may be null)
//         if (!objectIdOfCalledPerson) {
//           // skip if called person id can't be resolved
//           skippedNoDocId.push({ beoContact: rep.beoContact, docId: rep.docId, blockId: rep.blockId });
//           return null;
//         }

//         if (!objectIdOfCaller) nullCallerCount++;

//         const doc = {
//           objectIdOfCalledPerson,
//           objectIdOfCaller, // possibly null
//           callMadeTo: "BEO",
//           districtId: rep.districtId || null,
//           blockId: rep.blockId || null,
//           centerId: null, // BEOs are block level, no centerId
//           callType: null,
//           callingStatus: null,
//           callingRemark1: null,
//           callingRemark2: null,
//           mannualRemark: null,
//           callingDate: new Date()
//         };

//         return doc;
//       });

//       const results = await Promise.all(promises);
//       results.forEach((r) => {
//         if (r) candidateDocs.push(r);
//       });
//     }

//     // 3) Remove those already present (objectIdOfCalledPerson + callMadeTo:"BEO"), to avoid duplicates
//     const calledIds = candidateDocs.map((c) => c.objectIdOfCalledPerson).filter(Boolean);
//     const existing = await CallLeads.find(
//       { objectIdOfCalledPerson: { $in: calledIds }, callMadeTo: "BEO" },
//       { objectIdOfCalledPerson: 1 }
//     ).lean();
//     const existingSet = new Set((existing || []).map((e) => String(e.objectIdOfCalledPerson)));

//     const toInsert = candidateDocs.filter((c) => !existingSet.has(String(c.objectIdOfCalledPerson)));

//     const stats = {
//       uniqueBeoCount: uniqueCount,
//       candidateCount: candidateDocs.length,
//       toInsertCount: toInsert.length,
//       skippedDueToMissingDocId: skippedNoDocId.length,
//       nullCallerCount: candidateDocs.filter((c) => c.objectIdOfCaller == null).length,
//       rejectedCallerByDesignation
//     };

//     if (toInsert.length === 0) {
//       return res.status(200).json({
//         status: "oK",
//         message: "No BEO leads to insert (either already exist or missing docId).",
//         stats
//       });
//     }

//     // 4) Insert documents using raw collection API to allow null objectIdOfCaller (bypasses Mongoose validation)
//     let inserted = [];
//     try {
//       const insertResult = await CallLeads.collection.insertMany(
//         toInsert.map((d) => {
//           return {
//             ...d,
//             objectIdOfCalledPerson: d.objectIdOfCalledPerson ? d.objectIdOfCalledPerson : null,
//             objectIdOfCaller: d.objectIdOfCaller ? d.objectIdOfCaller : null,
//             createdAt: new Date(),
//             updatedAt: new Date()
//           };
//         }),
//         { ordered: false }
//       );

//       inserted = insertResult.insertedCount ? Object.values(insertResult.insertedIds).map((id) => ({ _id: id })) : [];
//     } catch (insertErr) {
//       if (insertErr && insertErr.result && insertErr.result.insertedIds) {
//         const ids = Object.values(insertErr.result.insertedIds);
//         inserted = ids.map((id) => ({ _id: id }));
//       } else {
//         console.error("Insert error (raw collection):", insertErr);
//       }

//       const writeErrors = insertErr && insertErr.writeErrors ? insertErr.writeErrors.map((we) => ({ index: we.index, errmsg: we.errmsg })) : null;

//       return res.status(500).json({
//         status: "error",
//         message: "Some BEO leads failed to insert (raw collection insert).",
//         stats,
//         attemptedToInsert: toInsert.length,
//         insertedCount: Array.isArray(inserted) ? inserted.length : 0,
//         inserted,
//         writeErrors
//       });
//     }

//     // 5) success response
//     return res.status(200).json({
//       status: "oK",
//       message: "BEO leads created (objectIdOfCaller may be null for some leads).",
//       stats,
//       created: Array.isArray(inserted) ? inserted.length : 0,
//       inserted
//     });
//   } catch (error) {
//     console.error("CreateBeosLeads error:", error);
//     return res.status(500).json({ status: "error", message: error.message || "Server error" });
//   }
// };









// export const CreateBeosLeads = async (req, res) => {

// console.log('hello beos call leads')

//   try {
//     // 1) unique BEO list (trimmed, prefer isCluster:true)
//     const uniqueBeo = await District_Block_School.aggregate([
//       {
//         $addFields: {
//           beoContactTrimmed: {
//             $trim: { input: { $ifNull: ["$beoContact", ""] } }
//           }
//         }
//       },
//       { $match: { beoContactTrimmed: { $nin: [null, ""] } } },
//       { $sort: { beoContactTrimmed: 1, isCluster: -1, updatedAt: -1 } },
//       {
//         $group: {
//           _id: "$beoContactTrimmed",
//           docId: { $first: "$_id" },
//           beo: { $first: "$beo" },
//           beoContact: { $first: "$beoContactTrimmed" },
//           isCluster: { $first: "$isCluster" },
//           districtId: { $first: "$districtId" },
//           blockId: { $first: "$blockId" },
//           blockName: { $first: "$blockName" }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           beoContactKey: "$_id",
//           docId: 1,
//           beo: 1,
//           beoContact: 1,
//           isCluster: 1,
//           districtId: 1,
//           blockId: 1,
//           blockName: 1
//         }
//       }
//     ]);

//     const uniqueCount = uniqueBeo.length;
//     if (uniqueCount === 0) {
//       return res.status(200).json({
//         status: "oK",
//         message: "No unique BEO contacts found (non-empty).",
//         uniqueBeoCount: 0,
//         created: 0,
//         inserted: []
//       });
//     }

//     // 2) For each unique BEO, find one caller (if any), build doc (caller may be null)
//     const CONCURRENCY = 50;
//     const chunks = [];
//     for (let i = 0; i < uniqueBeo.length; i += CONCURRENCY) {
//       chunks.push(uniqueBeo.slice(i, i + CONCURRENCY));
//     }

//     const candidateDocs = [];
//     const skippedNoDocId = [];
//     let nullCallerCount = 0;
//     let rejectedCallerByDesignation = 0;

//     for (const chunk of chunks) {
//       const promises = chunk.map(async (rep) => {
//         // require docId and blockId; if missing, skip
//         if (!rep.docId || !rep.blockId) {
//           skippedNoDocId.push({ beoContact: rep.beoContact, docId: rep.docId, blockId: rep.blockId });
//           return null;
//         }

//         // Try to find a UserAccess for blockId
//         const ua = await UserAccess.findOne({ "region.blockIds.blockId": rep.blockId }, { unqUserObjectId: 1 }).lean();

//         let callerUser = null;
//         if (ua && ua.unqUserObjectId) {
//           const foundUser = await User.findOne({ _id: ua.unqUserObjectId }).lean();
//           // accept only if designation === "ABRC"
//           if (foundUser && foundUser.designation === "ACI") {
//             callerUser = foundUser;
//           } else {
//             // user found but not a ABRC -> reject as caller
//             rejectedCallerByDesignation++;
//             callerUser = null;
//           }
//         }

//         // convert docId to ObjectId (school id)
//         let objectIdOfCalledPerson = null;
//         try {
//           objectIdOfCalledPerson =
//             rep.docId instanceof mongoose.Types.ObjectId ? rep.docId : new mongoose.Types.ObjectId(String(rep.docId));
//         } catch (e) {
//           objectIdOfCalledPerson = null;
//         }

//         // convert caller id if available, else null
//         let objectIdOfCaller = null;
//         if (callerUser && callerUser._id) {
//           try {
//             objectIdOfCaller =
//               callerUser._id instanceof mongoose.Types.ObjectId
//                 ? callerUser._id
//                 : new mongoose.Types.ObjectId(String(callerUser._id));
//           } catch (e) {
//             objectIdOfCaller = null;
//           }
//         } else {
//           objectIdOfCaller = null; // explicit null when no (valid) caller found
//         }

//         // build doc (objectIdOfCaller may be null)
//         if (!objectIdOfCalledPerson) {
//           // skip if called person id can't be resolved
//           skippedNoDocId.push({ beoContact: rep.beoContact, docId: rep.docId, blockId: rep.blockId });
//           return null;
//         }

//         if (!objectIdOfCaller) nullCallerCount++;

//         const doc = {
//           objectIdOfCalledPerson,
//           objectIdOfCaller, // possibly null
//           callMadeTo: "BEO",
//           districtId: rep.districtId || null,
//           blockId: rep.blockId || null,
//           centerId: null, // BEOs are block level, no centerId
//           callType: null,
//           callingStatus: null,
//           callingRemark1: null,
//           callingRemark2: null,
//           mannualRemark: null,
//           callingDate: new Date()
//         };

//         return doc;
//       });

//       const results = await Promise.all(promises);
//       results.forEach((r) => {
//         if (r) candidateDocs.push(r);
//       });
//     }

//     // 3) Remove those already present (objectIdOfCalledPerson + callMadeTo:"BEO"), to avoid duplicates
//     const toInsert = candidateDocs;

//     const stats = {
//       uniqueBeoCount: uniqueCount,
//       candidateCount: candidateDocs.length,
//       toInsertCount: toInsert.length,
//       skippedDueToMissingDocId: skippedNoDocId.length,
//       nullCallerCount: candidateDocs.filter((c) => c.objectIdOfCaller == null).length,
//       rejectedCallerByDesignation
//     };

//     if (toInsert.length === 0) {
//       return res.status(200).json({
//         status: "oK",
//         message: "No BEO leads to insert (either already exist or missing docId).",
//         stats
//       });
//     }

//     // 4) Insert documents using raw collection API to allow null objectIdOfCaller (bypasses Mongoose validation)
//     let inserted = [];
//     try {
//       const insertResult = await CallLeads.collection.insertMany(
//         toInsert.map((d) => {
//           return {
//             ...d,
//             objectIdOfCalledPerson: d.objectIdOfCalledPerson ? d.objectIdOfCalledPerson : null,
//             objectIdOfCaller: d.objectIdOfCaller ? d.objectIdOfCaller : null,
//             createdAt: new Date(),
//             updatedAt: new Date()
//           };
//         }),
//         { ordered: false }
//       );

//       inserted = insertResult.insertedCount ? Object.values(insertResult.insertedIds).map((id) => ({ _id: id })) : [];
//     } catch (insertErr) {
//       if (insertErr && insertErr.result && insertErr.result.insertedIds) {
//         const ids = Object.values(insertErr.result.insertedIds);
//         inserted = ids.map((id) => ({ _id: id }));
//       } else {
//         console.error("Insert error (raw collection):", insertErr);
//       }

//       const writeErrors = insertErr && insertErr.writeErrors ? insertErr.writeErrors.map((we) => ({ index: we.index, errmsg: we.errmsg })) : null;

//       return res.status(500).json({
//         status: "error",
//         message: "Some BEO leads failed to insert (raw collection insert).",
//         stats,
//         attemptedToInsert: toInsert.length,
//         insertedCount: Array.isArray(inserted) ? inserted.length : 0,
//         inserted,
//         writeErrors
//       });
//     }

//     // 5) success response
//     return res.status(200).json({
//       status: "oK",
//       message: "BEO leads created (objectIdOfCaller may be null for some leads).",
//       stats,
//       created: Array.isArray(inserted) ? inserted.length : 0,
//       inserted
//     });
//   } catch (error) {
//     console.error("CreateBeosLeads error:", error);
//     return res.status(500).json({ status: "error", message: error.message || "Server error" });
//   }
// };



export const CreateBeosLeads = async (req, res) => {
  console.log('hello beos call leads')

  try {
    // 1) Get all ACI users first (BEOs are also assigned to ACIs based on district)
    const aciUsers = await User.find(
      { designation: "ACI" }, 
      { _id: 1 }
    ).lean();

    // 2) Get UserAccess documents for these ACI users with district data
    const userAccessList = await UserAccess.find(
      { 
        unqUserObjectId: { $in: aciUsers.map(u => u._id) },
        "region.districtId": { $exists: true, $ne: null }
      },
      { unqUserObjectId: 1, region: 1 }
    ).lean();

    // 3) Create district to caller mapping (SAME AS DEOs)
    const districtToCallerMap = {};
    userAccessList.forEach(ua => {
      ua.region.forEach(region => {
        if (region.districtId) {
          districtToCallerMap[region.districtId] = ua.unqUserObjectId;
        }
      });
    });

    // 4) unique BEO list (trimmed, prefer isCluster:true)
    const uniqueBeo = await District_Block_School.aggregate([
      {
        $addFields: {
          beoContactTrimmed: {
            $trim: { input: { $ifNull: ["$beoContact", ""] } }
          }
        }
      },
      { $match: { beoContactTrimmed: { $nin: [null, ""] } } },
      { $sort: { beoContactTrimmed: 1, isCluster: -1, updatedAt: -1 } },
      {
        $group: {
          _id: "$beoContactTrimmed",
          docId: { $first: "$_id" },
          beo: { $first: "$beo" },
          beoContact: { $first: "$beoContactTrimmed" },
          isCluster: { $first: "$isCluster" },
          districtId: { $first: "$districtId" },
          blockId: { $first: "$blockId" },
          blockName: { $first: "$blockName" }
        }
      },
      {
        $project: {
          _id: 0,
          beoContactKey: "$_id",
          docId: 1,
          beo: 1,
          beoContact: 1,
          isCluster: 1,
          districtId: 1,
          blockId: 1,
          blockName: 1
        }
      }
    ]);

    const uniqueCount = uniqueBeo.length;
    if (uniqueCount === 0) {
      return res.status(200).json({
        status: "oK",
        message: "No unique BEO contacts found (non-empty).",
        uniqueBeoCount: 0,
        created: 0,
        inserted: []
      });
    }

    // 5) Process BEOs and assign callers using DISTRICT mapping
    const CONCURRENCY = 50;
    const chunks = [];
    for (let i = 0; i < uniqueBeo.length; i += CONCURRENCY) {
      chunks.push(uniqueBeo.slice(i, i + CONCURRENCY));
    }

    const candidateDocs = [];
    const skippedNoDocId = [];
    let nullCallerCount = 0;
    let rejectedCallerByDesignation = 0;

    for (const chunk of chunks) {
      const promises = chunk.map(async (rep) => {
        // require docId and districtId; if missing, skip
        if (!rep.docId || !rep.districtId) {
          skippedNoDocId.push({ beoContact: rep.beoContact, docId: rep.docId, districtId: rep.districtId });
          return null;
        }

        // OPTIMIZED: Get caller from pre-built DISTRICT mapping (SAME AS DEOs)
        let objectIdOfCaller = null;
        if (districtToCallerMap[rep.districtId]) {
          try {
            objectIdOfCaller = districtToCallerMap[rep.districtId] instanceof mongoose.Types.ObjectId 
              ? districtToCallerMap[rep.districtId] 
              : new mongoose.Types.ObjectId(String(districtToCallerMap[rep.districtId]));
          } catch (e) {
            objectIdOfCaller = null;
          }
        } else {
          nullCallerCount++;
        }

        // convert docId to ObjectId (school id)
        let objectIdOfCalledPerson = null;
        try {
          objectIdOfCalledPerson =
            rep.docId instanceof mongoose.Types.ObjectId ? rep.docId : new mongoose.Types.ObjectId(String(rep.docId));
        } catch (e) {
          objectIdOfCalledPerson = null;
        }

        // build doc (objectIdOfCaller may be null)
        if (!objectIdOfCalledPerson) {
          // skip if called person id can't be resolved
          skippedNoDocId.push({ beoContact: rep.beoContact, docId: rep.docId, districtId: rep.districtId });
          return null;
        }

        const doc = {
          objectIdOfCalledPerson,
          objectIdOfCaller, // possibly null
          callMadeTo: "BEO",
          districtId: rep.districtId || null,
          blockId: rep.blockId || null, // BEOs have blockId but caller is assigned by district
          centerId: null, // BEOs are block level, no centerId
          callType: null,
          callingStatus: null,
          callingRemark1: null,
          callingRemark2: null,
          mannualRemark: null,
          callingDate: new Date()
        };

        return doc;
      });

      const results = await Promise.all(promises);
      results.forEach((r) => {
        if (r) candidateDocs.push(r);
      });
    }

    const toInsert = candidateDocs;

    const stats = {
      uniqueBeoCount: uniqueCount,
      candidateCount: candidateDocs.length,
      toInsertCount: toInsert.length,
      skippedDueToMissingDocId: skippedNoDocId.length,
      nullCallerCount: candidateDocs.filter((c) => c.objectIdOfCaller == null).length,
      rejectedCallerByDesignation,
      aciUsersCount: aciUsers.length,
      userAccessCount: userAccessList.length,
      districtsMapped: Object.keys(districtToCallerMap).length
    };

    if (toInsert.length === 0) {
      return res.status(200).json({
        status: "oK",
        message: "No BEO leads to insert (either already exist or missing docId).",
        stats
      });
    }

    // 6) Insert documents using raw collection API to allow null objectIdOfCaller
    let inserted = [];
    try {
      const insertResult = await CallLeads.collection.insertMany(
        toInsert.map((d) => {
          return {
            ...d,
            objectIdOfCalledPerson: d.objectIdOfCalledPerson ? d.objectIdOfCalledPerson : null,
            objectIdOfCaller: d.objectIdOfCaller ? d.objectIdOfCaller : null,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }),
        { ordered: false }
      );

      inserted = insertResult.insertedCount ? Object.values(insertResult.insertedIds).map((id) => ({ _id: id })) : [];
    } catch (insertErr) {
      if (insertErr && insertErr.result && insertErr.result.insertedIds) {
        const ids = Object.values(insertErr.result.insertedIds);
        inserted = ids.map((id) => ({ _id: id }));
      } else {
        console.error("Insert error (raw collection):", insertErr);
      }

      const writeErrors = insertErr && insertErr.writeErrors ? insertErr.writeErrors.map((we) => ({ index: we.index, errmsg: we.errmsg })) : null;

      return res.status(500).json({
        status: "error",
        message: "Some BEO leads failed to insert (raw collection insert).",
        stats,
        attemptedToInsert: toInsert.length,
        insertedCount: Array.isArray(inserted) ? inserted.length : 0,
        inserted,
        writeErrors
      });
    }

    // 7) success response
    return res.status(200).json({
      status: "oK",
      message: "BEO leads created (objectIdOfCaller may be null for some leads).",
      stats,
      created: Array.isArray(inserted) ? inserted.length : 0,
      inserted
    });
  } catch (error) {
    console.error("CreateBeosLeads error:", error);
    return res.status(500).json({ status: "error", message: error.message || "Server error" });
  }
};



// export const CreateDeosLeads = async (req, res) => {

//   console.log('hello deos call leads')

//   try {
//     // 1) unique DEO list (trimmed)
//     const uniqueDeo = await District_Block_School.aggregate([
//       {
//         $addFields: {
//           deoContactTrimmed: {
//             $trim: { input: { $ifNull: ["$deoContact", ""] } }
//           }
//         }
//       },
//       { $match: { deoContactTrimmed: { $nin: [null, ""] } } },
//       { $sort: { deoContactTrimmed: 1, updatedAt: -1 } },
//       {
//         $group: {
//           _id: "$deoContactTrimmed",
//           docId: { $first: "$_id" },
//           deo: { $first: "$deo" },
//           deoContact: { $first: "$deoContactTrimmed" },
//           districtId: { $first: "$districtId" },
//           districtName: { $first: "$districtName" }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           deoContactKey: "$_id",
//           docId: 1,
//           deo: 1,
//           deoContact: 1,
//           districtId: 1,
//           districtName: 1
//         }
//       }
//     ]);

//     const uniqueCount = uniqueDeo.length;
//     if (uniqueCount === 0) {
//       return res.status(200).json({
//         status: "oK",
//         message: "No unique DEO contacts found (non-empty).",
//         uniqueDeoCount: 0,
//         created: 0,
//         inserted: []
//       });
//     }

//     // 2) For each unique DEO, find one caller (if any), build doc (caller may be null)
//     const CONCURRENCY = 50;
//     const chunks = [];
//     for (let i = 0; i < uniqueDeo.length; i += CONCURRENCY) {
//       chunks.push(uniqueDeo.slice(i, i + CONCURRENCY));
//     }

//     const candidateDocs = [];
//     const skippedNoDocId = [];
//     let nullCallerCount = 0;
//     let rejectedCallerByDesignation = 0;

//     for (const chunk of chunks) {
//       const promises = chunk.map(async (rep) => {
//         // require docId and districtId; if missing, skip
//         if (!rep.docId || !rep.districtId) {
//           skippedNoDocId.push({ deoContact: rep.deoContact, docId: rep.docId, districtId: rep.districtId });
//           return null;
//         }

//         // Try to find a UserAccess for districtId
//         const ua = await UserAccess.findOne({ "region.districtId": rep.districtId }, { unqUserObjectId: 1 }).lean();

//         let callerUser = null;
//         if (ua && ua.unqUserObjectId) {
//           const foundUser = await User.findOne({ _id: ua.unqUserObjectId }).lean();
//           // accept only if designation === "ABRC"
//           if (foundUser && foundUser.designation === "ABRC") {
//             callerUser = foundUser;
//           } else {
//             // user found but not a ABRC -> reject as caller
//             rejectedCallerByDesignation++;
//             callerUser = null;
//           }
//         }

//         // convert docId to ObjectId (school id)
//         let objectIdOfCalledPerson = null;
//         try {
//           objectIdOfCalledPerson =
//             rep.docId instanceof mongoose.Types.ObjectId ? rep.docId : new mongoose.Types.ObjectId(String(rep.docId));
//         } catch (e) {
//           objectIdOfCalledPerson = null;
//         }

//         // convert caller id if available, else null
//         let objectIdOfCaller = null;
//         if (callerUser && callerUser._id) {
//           try {
//             objectIdOfCaller =
//               callerUser._id instanceof mongoose.Types.ObjectId
//                 ? callerUser._id
//                 : new mongoose.Types.ObjectId(String(callerUser._id));
//           } catch (e) {
//             objectIdOfCaller = null;
//           }
//         } else {
//           objectIdOfCaller = null; // explicit null when no (valid) caller found
//         }

//         // build doc (objectIdOfCaller may be null)
//         if (!objectIdOfCalledPerson) {
//           // skip if called person id can't be resolved
//           skippedNoDocId.push({ deoContact: rep.deoContact, docId: rep.docId, districtId: rep.districtId });
//           return null;
//         }

//         if (!objectIdOfCaller) nullCallerCount++;

//         const doc = {
//           objectIdOfCalledPerson,
//           objectIdOfCaller, // possibly null
//           callMadeTo: "DEO",
//           districtId: rep.districtId || null,
//           blockId: null, // DEOs are district level, no blockId
//           centerId: null, // DEOs are district level, no centerId
//           callType: null,
//           callingStatus: null,
//           callingRemark1: null,
//           callingRemark2: null,
//           mannualRemark: null,
//           callingDate: new Date()
//         };

//         return doc;
//       });

//       const results = await Promise.all(promises);
//       results.forEach((r) => {
//         if (r) candidateDocs.push(r);
//       });
//     }

//     // 3) Remove those already present (objectIdOfCalledPerson + callMadeTo:"DEO"), to avoid duplicates
//     const calledIds = candidateDocs.map((c) => c.objectIdOfCalledPerson).filter(Boolean);
//     const existing = await CallLeads.find(
//       { objectIdOfCalledPerson: { $in: calledIds }, callMadeTo: "DEO" },
//       { objectIdOfCalledPerson: 1 }
//     ).lean();
//     const existingSet = new Set((existing || []).map((e) => String(e.objectIdOfCalledPerson)));

//     const toInsert = candidateDocs.filter((c) => !existingSet.has(String(c.objectIdOfCalledPerson)));

//     const stats = {
//       uniqueDeoCount: uniqueCount,
//       candidateCount: candidateDocs.length,
//       toInsertCount: toInsert.length,
//       skippedDueToMissingDocId: skippedNoDocId.length,
//       nullCallerCount: candidateDocs.filter((c) => c.objectIdOfCaller == null).length,
//       rejectedCallerByDesignation
//     };

//     if (toInsert.length === 0) {
//       return res.status(200).json({
//         status: "oK",
//         message: "No DEO leads to insert (either already exist or missing docId).",
//         stats
//       });
//     }

//     // 4) Insert documents using raw collection API to allow null objectIdOfCaller (bypasses Mongoose validation)
//     let inserted = [];
//     try {
//       const insertResult = await CallLeads.collection.insertMany(
//         toInsert.map((d) => {
//           return {
//             ...d,
//             objectIdOfCalledPerson: d.objectIdOfCalledPerson ? d.objectIdOfCalledPerson : null,
//             objectIdOfCaller: d.objectIdOfCaller ? d.objectIdOfCaller : null,
//             createdAt: new Date(),
//             updatedAt: new Date()
//           };
//         }),
//         { ordered: false }
//       );

//       inserted = insertResult.insertedCount ? Object.values(insertResult.insertedIds).map((id) => ({ _id: id })) : [];
//     } catch (insertErr) {
//       if (insertErr && insertErr.result && insertErr.result.insertedIds) {
//         const ids = Object.values(insertErr.result.insertedIds);
//         inserted = ids.map((id) => ({ _id: id }));
//       } else {
//         console.error("Insert error (raw collection):", insertErr);
//       }

//       const writeErrors = insertErr && insertErr.writeErrors ? insertErr.writeErrors.map((we) => ({ index: we.index, errmsg: we.errmsg })) : null;

//       return res.status(500).json({
//         status: "error",
//         message: "Some DEO leads failed to insert (raw collection insert).",
//         stats,
//         attemptedToInsert: toInsert.length,
//         insertedCount: Array.isArray(inserted) ? inserted.length : 0,
//         inserted,
//         writeErrors
//       });
//     }

//     // 5) success response
//     return res.status(200).json({
//       status: "oK",
//       message: "DEO leads created (objectIdOfCaller may be null for some leads).",
//       stats,
//       created: Array.isArray(inserted) ? inserted.length : 0,
//       inserted
//     });
//   } catch (error) {
//     console.error("CreateDeosLeads error:", error);
//     return res.status(500).json({ status: "error", message: error.message || "Server error" });
//   }
// };




// export const CreateDeosLeads = async (req, res) => {

//   console.log('hello deos call leads')

//   try {
//     // 1) unique DEO list (trimmed)
//     const uniqueDeo = await District_Block_School.aggregate([
//       {
//         $addFields: {
//           deoContactTrimmed: {
//             $trim: { input: { $ifNull: ["$deoContact", ""] } }
//           }
//         }
//       },
//       { $match: { deoContactTrimmed: { $nin: [null, ""] } } },
//       { $sort: { deoContactTrimmed: 1, updatedAt: -1 } },
//       {
//         $group: {
//           _id: "$deoContactTrimmed",
//           docId: { $first: "$_id" },
//           deo: { $first: "$deo" },
//           deoContact: { $first: "$deoContactTrimmed" },
//           districtId: { $first: "$districtId" },
//           districtName: { $first: "$districtName" }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           deoContactKey: "$_id",
//           docId: 1,
//           deo: 1,
//           deoContact: 1,
//           districtId: 1,
//           districtName: 1
//         }
//       }
//     ]);

//     const uniqueCount = uniqueDeo.length;
//     if (uniqueCount === 0) {
//       return res.status(200).json({
//         status: "oK",
//         message: "No unique DEO contacts found (non-empty).",
//         uniqueDeoCount: 0,
//         created: 0,
//         inserted: []
//       });
//     }

//     // 2) For each unique DEO, find one caller (if any), build doc (caller may be null)
//     const CONCURRENCY = 50;
//     const chunks = [];
//     for (let i = 0; i < uniqueDeo.length; i += CONCURRENCY) {
//       chunks.push(uniqueDeo.slice(i, i + CONCURRENCY));
//     }

//     const candidateDocs = [];
//     const skippedNoDocId = [];
//     let nullCallerCount = 0;
//     let rejectedCallerByDesignation = 0;

//     for (const chunk of chunks) {
//       const promises = chunk.map(async (rep) => {
//         // require docId and districtId; if missing, skip
//         if (!rep.docId || !rep.districtId) {
//           skippedNoDocId.push({ deoContact: rep.deoContact, docId: rep.docId, districtId: rep.districtId });
//           return null;
//         }

//         // Try to find a UserAccess for districtId
//         const ua = await UserAccess.findOne({ "region.districtId": rep.districtId }, { unqUserObjectId: 1 }).lean();

//         let callerUser = null;
//         if (ua && ua.unqUserObjectId) {
//           const foundUser = await User.findOne({ _id: ua.unqUserObjectId }).lean();
//           // accept only if designation === "ABRC"
//           if (foundUser && foundUser.designation === "ACI") {
//             callerUser = foundUser;
//           } else {
//             // user found but not a ABRC -> reject as caller
//             rejectedCallerByDesignation++;
//             callerUser = null;
//           }
//         }

//         // convert docId to ObjectId (school id)
//         let objectIdOfCalledPerson = null;
//         try {
//           objectIdOfCalledPerson =
//             rep.docId instanceof mongoose.Types.ObjectId ? rep.docId : new mongoose.Types.ObjectId(String(rep.docId));
//         } catch (e) {
//           objectIdOfCalledPerson = null;
//         }

//         // convert caller id if available, else null
//         let objectIdOfCaller = null;
//         if (callerUser && callerUser._id) {
//           try {
//             objectIdOfCaller =
//               callerUser._id instanceof mongoose.Types.ObjectId
//                 ? callerUser._id
//                 : new mongoose.Types.ObjectId(String(callerUser._id));
//           } catch (e) {
//             objectIdOfCaller = null;
//           }
//         } else {
//           objectIdOfCaller = null; // explicit null when no (valid) caller found
//         }

//         // build doc (objectIdOfCaller may be null)
//         if (!objectIdOfCalledPerson) {
//           // skip if called person id can't be resolved
//           skippedNoDocId.push({ deoContact: rep.deoContact, docId: rep.docId, districtId: rep.districtId });
//           return null;
//         }

//         if (!objectIdOfCaller) nullCallerCount++;

//         const doc = {
//           objectIdOfCalledPerson,
//           objectIdOfCaller, // possibly null
//           callMadeTo: "DEO",
//           districtId: rep.districtId || null,
//           blockId: null, // DEOs are district level, no blockId
//           centerId: null, // DEOs are district level, no centerId
//           callType: null,
//           callingStatus: null,
//           callingRemark1: null,
//           callingRemark2: null,
//           mannualRemark: null,
//           callingDate: new Date()
//         };

//         return doc;
//       });

//       const results = await Promise.all(promises);
//       results.forEach((r) => {
//         if (r) candidateDocs.push(r);
//       });
//     }

//     // REMOVED: Duplicate validation check for objectIdOfCalledPerson
//     const toInsert = candidateDocs;

//     const stats = {
//       uniqueDeoCount: uniqueCount,
//       candidateCount: candidateDocs.length,
//       toInsertCount: toInsert.length,
//       skippedDueToMissingDocId: skippedNoDocId.length,
//       nullCallerCount: candidateDocs.filter((c) => c.objectIdOfCaller == null).length,
//       rejectedCallerByDesignation
//     };

//     if (toInsert.length === 0) {
//       return res.status(200).json({
//         status: "oK",
//         message: "No DEO leads to insert (missing docId).",
//         stats
//       });
//     }

//     // 4) Insert documents using raw collection API to allow null objectIdOfCaller (bypasses Mongoose validation)
//     let inserted = [];
//     try {
//       const insertResult = await CallLeads.collection.insertMany(
//         toInsert.map((d) => {
//           return {
//             ...d,
//             objectIdOfCalledPerson: d.objectIdOfCalledPerson ? d.objectIdOfCalledPerson : null,
//             objectIdOfCaller: d.objectIdOfCaller ? d.objectIdOfCaller : null,
//             createdAt: new Date(),
//             updatedAt: new Date()
//           };
//         }),
//         { ordered: false }
//       );

//       inserted = insertResult.insertedCount ? Object.values(insertResult.insertedIds).map((id) => ({ _id: id })) : [];
//     } catch (insertErr) {
//       if (insertErr && insertErr.result && insertErr.result.insertedIds) {
//         const ids = Object.values(insertErr.result.insertedIds);
//         inserted = ids.map((id) => ({ _id: id }));
//       } else {
//         console.error("Insert error (raw collection):", insertErr);
//       }

//       const writeErrors = insertErr && insertErr.writeErrors ? insertErr.writeErrors.map((we) => ({ index: we.index, errmsg: we.errmsg })) : null;

//       return res.status(500).json({
//         status: "error",
//         message: "Some DEO leads failed to insert (raw collection insert).",
//         stats,
//         attemptedToInsert: toInsert.length,
//         insertedCount: Array.isArray(inserted) ? inserted.length : 0,
//         inserted,
//         writeErrors
//       });
//     }

//     // 5) success response
//     return res.status(200).json({
//       status: "oK",
//       message: "DEO leads created (objectIdOfCaller may be null for some leads).",
//       stats,
//       created: Array.isArray(inserted) ? inserted.length : 0,
//       inserted
//     });
//   } catch (error) {
//     console.error("CreateDeosLeads error:", error);
//     return res.status(500).json({ status: "error", message: error.message || "Server error" });
//   }
// };






export const CreateDeosLeads = async (req, res) => {
  console.log('hello deos call leads')

  try {
    // 1) Get all ACI users first
    const aciUsers = await User.find(
      { designation: "ACI" }, 
      { _id: 1 }
    ).lean();

    // 2) Get UserAccess documents for these ACI users
    const userAccessList = await UserAccess.find(
      { 
        unqUserObjectId: { $in: aciUsers.map(u => u._id) },
        "region.districtId": { $exists: true, $ne: null }
      },
      { unqUserObjectId: 1, region: 1 }
    ).lean();

    // 3) Create district to caller mapping
    const districtToCallerMap = {};
    userAccessList.forEach(ua => {
      ua.region.forEach(region => {
        if (region.districtId) {
          districtToCallerMap[region.districtId] = ua.unqUserObjectId;
        }
      });
    });

    // 4) unique DEO list (trimmed)
    const uniqueDeo = await District_Block_School.aggregate([
      {
        $addFields: {
          deoContactTrimmed: {
            $trim: { input: { $ifNull: ["$deoContact", ""] } }
          }
        }
      },
      { $match: { deoContactTrimmed: { $nin: [null, ""] } } },
      { $sort: { deoContactTrimmed: 1, updatedAt: -1 } },
      {
        $group: {
          _id: "$deoContactTrimmed",
          docId: { $first: "$_id" },
          deo: { $first: "$deo" },
          deoContact: { $first: "$deoContactTrimmed" },
          districtId: { $first: "$districtId" },
          districtName: { $first: "$districtName" }
        }
      },
      {
        $project: {
          _id: 0,
          deoContactKey: "$_id",
          docId: 1,
          deo: 1,
          deoContact: 1,
          districtId: 1,
          districtName: 1
        }
      }
    ]);

    const uniqueCount = uniqueDeo.length;
    if (uniqueCount === 0) {
      return res.status(200).json({
        status: "oK",
        message: "No unique DEO contacts found (non-empty).",
        uniqueDeoCount: 0,
        created: 0,
        inserted: []
      });
    }

    // 5) Process DEOs and assign callers using the mapping
    const CONCURRENCY = 50;
    const chunks = [];
    for (let i = 0; i < uniqueDeo.length; i += CONCURRENCY) {
      chunks.push(uniqueDeo.slice(i, i + CONCURRENCY));
    }

    const candidateDocs = [];
    const skippedNoDocId = [];
    let nullCallerCount = 0;
    let rejectedCallerByDesignation = 0;

    for (const chunk of chunks) {
      const promises = chunk.map(async (rep) => {
        // require docId and districtId; if missing, skip
        if (!rep.docId || !rep.districtId) {
          skippedNoDocId.push({ deoContact: rep.deoContact, docId: rep.docId, districtId: rep.districtId });
          return null;
        }

        // OPTIMIZED: Get caller from pre-built mapping
        let objectIdOfCaller = null;
        if (districtToCallerMap[rep.districtId]) {
          try {
            objectIdOfCaller = districtToCallerMap[rep.districtId] instanceof mongoose.Types.ObjectId 
              ? districtToCallerMap[rep.districtId] 
              : new mongoose.Types.ObjectId(String(districtToCallerMap[rep.districtId]));
          } catch (e) {
            objectIdOfCaller = null;
          }
        } else {
          nullCallerCount++;
        }

        // convert docId to ObjectId (school id)
        let objectIdOfCalledPerson = null;
        try {
          objectIdOfCalledPerson =
            rep.docId instanceof mongoose.Types.ObjectId ? rep.docId : new mongoose.Types.ObjectId(String(rep.docId));
        } catch (e) {
          objectIdOfCalledPerson = null;
        }

        // build doc (objectIdOfCaller may be null)
        if (!objectIdOfCalledPerson) {
          // skip if called person id can't be resolved
          skippedNoDocId.push({ deoContact: rep.deoContact, docId: rep.docId, districtId: rep.districtId });
          return null;
        }

        const doc = {
          objectIdOfCalledPerson,
          objectIdOfCaller, // possibly null
          callMadeTo: "DEO",
          districtId: rep.districtId || null,
          blockId: null, // DEOs are district level, no blockId
          centerId: null, // DEOs are district level, no centerId
          callType: null,
          callingStatus: null,
          callingRemark1: null,
          callingRemark2: null,
          mannualRemark: null,
          callingDate: new Date()
        };

        return doc;
      });

      const results = await Promise.all(promises);
      results.forEach((r) => {
        if (r) candidateDocs.push(r);
      });
    }

    const toInsert = candidateDocs;

    const stats = {
      uniqueDeoCount: uniqueCount,
      candidateCount: candidateDocs.length,
      toInsertCount: toInsert.length,
      skippedDueToMissingDocId: skippedNoDocId.length,
      nullCallerCount: candidateDocs.filter((c) => c.objectIdOfCaller == null).length,
      rejectedCallerByDesignation,
      aciUsersCount: aciUsers.length,
      userAccessCount: userAccessList.length,
      districtsMapped: Object.keys(districtToCallerMap).length
    };

    if (toInsert.length === 0) {
      return res.status(200).json({
        status: "oK",
        message: "No DEO leads to insert (missing docId).",
        stats
      });
    }

    // 6) Insert documents using raw collection API to allow null objectIdOfCaller
    let inserted = [];
    try {
      const insertResult = await CallLeads.collection.insertMany(
        toInsert.map((d) => {
          return {
            ...d,
            objectIdOfCalledPerson: d.objectIdOfCalledPerson ? d.objectIdOfCalledPerson : null,
            objectIdOfCaller: d.objectIdOfCaller ? d.objectIdOfCaller : null,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }),
        { ordered: false }
      );

      inserted = insertResult.insertedCount ? Object.values(insertResult.insertedIds).map((id) => ({ _id: id })) : [];
    } catch (insertErr) {
      if (insertErr && insertErr.result && insertErr.result.insertedIds) {
        const ids = Object.values(insertErr.result.insertedIds);
        inserted = ids.map((id) => ({ _id: id }));
      } else {
        console.error("Insert error (raw collection):", insertErr);
      }

      const writeErrors = insertErr && insertErr.writeErrors ? insertErr.writeErrors.map((we) => ({ index: we.index, errmsg: we.errmsg })) : null;

      return res.status(500).json({
        status: "error",
        message: "Some DEO leads failed to insert (raw collection insert).",
        stats,
        attemptedToInsert: toInsert.length,
        insertedCount: Array.isArray(inserted) ? inserted.length : 0,
        inserted,
        writeErrors
      });
    }

    // 7) success response
    return res.status(200).json({
      status: "oK",
      message: "DEO leads created (objectIdOfCaller may be null for some leads).",
      stats,
      created: Array.isArray(inserted) ? inserted.length : 0,
      inserted
    });
  } catch (error) {
    console.error("CreateDeosLeads error:", error);
    return res.status(500).json({ status: "error", message: error.message || "Server error" });
  }
};

//Get call leads with aggeregation



// export const GetCallLeadsByUserObjectId = async (req, res) => {

//   try {

//     const { objectIdOfCaller, callMadeTo } = req.body;
//     console.log(req.body)

//     // Validate required input
//     if (!callMadeTo) {
//       return res.status(400).json({ status: "error", message: "callMadeTo is required in body" });

//     }

//     // Build match stage
//     const match = { callMadeTo };

//     // add 5-day filter (from now)
//     const now = new Date();
//     const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
//     match.callingDate = { $gte: fiveDaysAgo };

//     if (objectIdOfCaller !== undefined && objectIdOfCaller !== null && String(objectIdOfCaller).trim() !== "") {
//       try {
//         match.objectIdOfCaller = new mongoose.Types.ObjectId(String(objectIdOfCaller));
//       } catch (err) {
//         return res.status(400).json({ status: "error", message: "Invalid objectIdOfCaller" });
//       }
//     } else {
//       // if objectIdOfCaller not provided, we match all leads for the given callMadeTo within last 5 days
//       // (if you want to require objectIdOfCaller, uncomment below)
//       // return res.status(400).json({ status: "error", message: "objectIdOfCaller is required" });
//     }

//     const pipeline = [
//       { $match: match },

//       // lookup caller user details
//       {
//         $lookup: {
//           from: "users",
//           localField: "objectIdOfCaller",
//           foreignField: "_id",
//           as: "callerUser"
//         }
//       },
//       { $unwind: { path: "$callerUser", preserveNullAndEmptyArrays: true } },

//       // lookup useraccesses for the caller (by unqUserObjectId)
//       {
//         $lookup: {
//           from: "useraccesses",
//           localField: "objectIdOfCaller",
//           foreignField: "unqUserObjectId",
//           as: "callerAccesses"
//         }
//       },
//       // callerAccesses may be array; keep as array

//       // lookup details about the called person: district_block_schools doc
//       {
//         $lookup: {
//           from: "district_block_schools",
//           localField: "objectIdOfCalledPerson",
//           foreignField: "_id",
//           as: "calledSchool"
//         }
//       },
//       { $unwind: { path: "$calledSchool", preserveNullAndEmptyArrays: true } },

//       // project friendly output
//       {
//         $project: {
//           _id: 1,
//           callMadeTo: 1,
//           districtId: 1,
//           blockId: 1,
//           centerId: 1,
//           callType: 1,
//           callingStatus: 1,
//           callingRemark1: 1,
//           callingRemark2: 1,
//           mannualRemark: 1,
//           callingDate: 1,
//           createdAt: 1,
//           updatedAt: 1,

//           // caller user summary (may be null)
//           callerUser: {
//             _id: "$callerUser._id",
//             userName: "$callerUser.userName",
//             designation: "$callerUser.designation",
//             mobile: "$callerUser.mobile",
//             createdAt: "$callerUser.createdAt",
//             updatedAt: "$callerUser.updatedAt"
//           },

//           // caller accesses array
//           callerAccesses: 1, // raw useraccess documents (region array inside)

//           // called school summary (may be null)
//           calledPerson: {
//             _id: "$calledSchool._id",
//             districtId: "$calledSchool.districtId",
//             districtName: "$calledSchool.districtName",
//             blockId: "$calledSchool.blockId",
//             blockName: "$calledSchool.blockName",
//             centerId: "$calledSchool.centerId",
//             centerName: "$calledSchool.centerName",
//             principal: "$calledSchool.principal",
//             princiaplContact: "$calledSchool.princiaplContact",
//             abrc: "$calledSchool.abrc",
//             abrcContact: "$calledSchool.abrcContact",
//             isCluster: "$calledSchool.isCluster"
//           }
//         }
//       },

//       // sort newest first
//       { $sort: { callingDate: -1, createdAt: -1 } }
//     ];


//     const data = await CallLeads.aggregate(pipeline);

//     return res.status(200).json({
//       status: "oK",
//       count: Array.isArray(data) ? data.length : 0,
//       data
//     });
//   } catch (error) {
//     console.error("GetCallLeadsByUserObjectId error:", error);
//     return res.status(500).json({ status: "error", message: error.message || "Server error" });
//   }
// };



// export const GetCallLeadsByUserObjectId = async (req, res) => {

//   try {

//     const { objectIdOfCaller, callMadeTo } = req.body;
//     console.log(req.body)

//     // Validate required input
//     if (!callMadeTo) {
//       return res.status(400).json({ status: "error", message: "callMadeTo is required in body" });

//     }

//     // Build match stage
//     const match = { callMadeTo };

//     // add 5-day filter (from now)
//     const now = new Date();
//     const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
//     match.callingDate = { $gte: fiveDaysAgo };

//     if (objectIdOfCaller !== undefined && objectIdOfCaller !== null && String(objectIdOfCaller).trim() !== "") {
//       try {
//         match.objectIdOfCaller = new mongoose.Types.ObjectId(String(objectIdOfCaller));
//       } catch (err) {
//         return res.status(400).json({ status: "error", message: "Invalid objectIdOfCaller" });
//       }
//     } else {
//       // if objectIdOfCaller not provided, we match all leads for the given callMadeTo within last 5 days
//       // (if you want to require objectIdOfCaller, uncomment below)
//       // return res.status(400).json({ status: "error", message: "objectIdOfCaller is required" });
//     }

//     const pipeline = [
//       { $match: match },

//       // lookup caller user details
//       {
//         $lookup: {
//           from: "users",
//           localField: "objectIdOfCaller",
//           foreignField: "_id",
//           as: "callerUser"
//         }
//       },
//       { $unwind: { path: "$callerUser", preserveNullAndEmptyArrays: true } },

//       // lookup useraccesses for the caller (by unqUserObjectId)
//       {
//         $lookup: {
//           from: "useraccesses",
//           localField: "objectIdOfCaller",
//           foreignField: "unqUserObjectId",
//           as: "callerAccesses"
//         }
//       },
//       // callerAccesses may be array; keep as array

//       // lookup details about the called person: district_block_schools doc
//       {
//         $lookup: {
//           from: "district_block_schools",
//           localField: "objectIdOfCalledPerson",
//           foreignField: "_id",
//           as: "calledSchool"
//         }
//       },
//       { $unwind: { path: "$calledSchool", preserveNullAndEmptyArrays: true } },

//       // lookup for calledPersonRegion based on abrcContact
//       {
//         $lookup: {
//           from: "district_block_schools",
//           let: { abrcContact: "$calledSchool.abrcContact" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$abrcContact", "$$abrcContact"] },
//                     { $ne: ["$abrcContact", null] },
//                     { $ne: ["$abrcContact", ""] }
//                   ]
//                 }
//               }
//             }
//           ],
//           as: "calledPersonRegion"
//         }
//       },

//       // project friendly output
//       {
//         $project: {
//           _id: 1,
//           callMadeTo: 1,
//           districtId: 1,
//           blockId: 1,
//           centerId: 1,
//           callType: 1,
//           callingStatus: 1,
//           callingRemark1: 1,
//           callingRemark2: 1,
//           mannualRemark: 1,
//           callingDate: 1,
//           createdAt: 1,
//           updatedAt: 1,

//           // caller user summary (may be null)
//           callerUser: {
//             _id: "$callerUser._id",
//             userName: "$callerUser.userName",
//             designation: "$callerUser.designation",
//             mobile: "$callerUser.mobile",
//             createdAt: "$callerUser.createdAt",
//             updatedAt: "$callerUser.updatedAt"
//           },

//           // caller accesses array
//           callerAccesses: 1, // raw useraccess documents (region array inside)

//           // called school summary (may be null)
//           calledPerson: {
//             _id: "$calledSchool._id",
//             districtId: "$calledSchool.districtId",
//             districtName: "$calledSchool.districtName",
//             blockId: "$calledSchool.blockId",
//             blockName: "$calledSchool.blockName",
//             centerId: "$calledSchool.centerId",
//             centerName: "$calledSchool.centerName",
//             principal: "$calledSchool.principal",
//             princiaplContact: "$calledSchool.princiaplContact",
//             abrc: "$calledSchool.abrc",
//             abrcContact: "$calledSchool.abrcContact",
//             isCluster: "$calledSchool.isCluster"
//           },

//           // called person region - all schools with same abrcContact
//           calledPersonRegion: 1
//         }
//       },

//       // sort newest first
//       { $sort: { callingDate: -1, createdAt: -1 } }
//     ];


//     const data = await CallLeads.aggregate(pipeline);

//     return res.status(200).json({
//       status: "oK",
//       count: Array.isArray(data) ? data.length : 0,
//       data
//     });
//   } catch (error) {
//     console.error("GetCallLeadsByUserObjectId error:", error);
//     return res.status(500).json({ status: "error", message: error.message || "Server error" });
//   }
// };




export const GetCallLeadsByUserObjectId = async (req, res) => {

  try {

    const { objectIdOfCaller, callMadeTo } = req.body;
    console.log(req.body)

    // Validate required input
    if (!callMadeTo) {
      return res.status(400).json({ status: "error", message: "callMadeTo is required in body" });

    }

    // Build match stage
    const match = { callMadeTo };

    // add 5-day filter (from now)
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    match.callingDate = { $gte: fiveDaysAgo };

    if (objectIdOfCaller !== undefined && objectIdOfCaller !== null && String(objectIdOfCaller).trim() !== "") {
      try {
        match.objectIdOfCaller = new mongoose.Types.ObjectId(String(objectIdOfCaller));
      } catch (err) {
        return res.status(400).json({ status: "error", message: "Invalid objectIdOfCaller" });
      }
    } else {
      // if objectIdOfCaller not provided, we match all leads for the given callMadeTo within last 5 days
      // (if you want to require objectIdOfCaller, uncomment below)
      // return res.status(400).json({ status: "error", message: "objectIdOfCaller is required" });
    }

    const pipeline = [
      { $match: match },

      // lookup caller user details
      {
        $lookup: {
          from: "users",
          localField: "objectIdOfCaller",
          foreignField: "_id",
          as: "callerUser"
        }
      },
      { $unwind: { path: "$callerUser", preserveNullAndEmptyArrays: true } },

      // lookup useraccesses for the caller (by unqUserObjectId)
      {
        $lookup: {
          from: "useraccesses",
          localField: "objectIdOfCaller",
          foreignField: "unqUserObjectId",
          as: "callerAccesses"
        }
      },
      // callerAccesses may be array; keep as array

      // lookup details about the called person: district_block_schools doc
      {
        $lookup: {
          from: "district_block_schools",
          localField: "objectIdOfCalledPerson",
          foreignField: "_id",
          as: "calledSchool"
        }
      },
      { $unwind: { path: "$calledSchool", preserveNullAndEmptyArrays: true } },

      // DYNAMIC: lookup for calledPersonRegion based on callMadeTo
      {
        $lookup: {
          from: "district_block_schools",
          let: { 
            callMadeTo: "$callMadeTo",
            abrcContact: "$calledSchool.abrcContact",
            beoContact: "$calledSchool.beoContact",
            deoContact: "$calledSchool.deoContact"
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $cond: {
                    if: { $eq: ["$$callMadeTo", "ABRC"] },
                    then: {
                      $and: [
                        { $eq: ["$abrcContact", "$$abrcContact"] },
                        { $ne: ["$abrcContact", null] },
                        { $ne: ["$abrcContact", ""] }
                      ]
                    },
                    else: {
                      $cond: {
                        if: { $eq: ["$$callMadeTo", "BEO"] },
                        then: {
                          $and: [
                            { $eq: ["$beoContact", "$$beoContact"] },
                            { $ne: ["$beoContact", null] },
                            { $ne: ["$beoContact", ""] }
                          ]
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["$$callMadeTo", "DEO"] },
                            then: {
                              $and: [
                                { $eq: ["$deoContact", "$$deoContact"] },
                                { $ne: ["$deoContact", null] },
                                { $ne: ["$deoContact", ""] }
                              ]
                            },
                            else: { $eq: [1, 1] } // default match all if unknown callMadeTo
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          ],
          as: "calledPersonRegion"
        }
      },

      // project friendly output
      {
        $project: {
          _id: 1,
          callMadeTo: 1,
          districtId: 1,
          blockId: 1,
          centerId: 1,
          callType: 1,
          callingStatus: 1,
          callingRemark1: 1,
          callingRemark2: 1,
          mannualRemark: 1,
          callingDate: 1,
          createdAt: 1,
          updatedAt: 1,

          // caller user summary (may be null)
          callerUser: {
            _id: "$callerUser._id",
            userName: "$callerUser.userName",
            designation: "$callerUser.designation",
            mobile: "$callerUser.mobile",
            createdAt: "$callerUser.createdAt",
            updatedAt: "$callerUser.updatedAt"
          },

          // caller accesses array
          callerAccesses: 1, // raw useraccess documents (region array inside)

          // called school summary (may be null)
          calledPerson: {
            _id: "$calledSchool._id",
            districtId: "$calledSchool.districtId",
            districtName: "$calledSchool.districtName",
            blockId: "$calledSchool.blockId",
            blockName: "$calledSchool.blockName",
            centerId: "$calledSchool.centerId",
            centerName: "$calledSchool.centerName",
            principal: "$calledSchool.principal",
            princiaplContact: "$calledSchool.princiaplContact",
            abrc: "$calledSchool.abrc",
            abrcContact: "$calledSchool.abrcContact",
            beo: "$calledSchool.beo",
            beoContact: "$calledSchool.beoContact",
            deo: "$calledSchool.deo",
            deoContact: "$calledSchool.deoContact",
            isCluster: "$calledSchool.isCluster"
          },

          // called person region - all schools with same contact based on callMadeTo
          calledPersonRegion: 1
        }
      },

      // sort newest first
      { $sort: { callingDate: -1, createdAt: -1 } }
    ];


    const data = await CallLeads.aggregate(pipeline);

    return res.status(200).json({
      status: "oK",
      count: Array.isArray(data) ? data.length : 0,
      data
    });
  } catch (error) {
    console.error("GetCallLeadsByUserObjectId error:", error);
    return res.status(500).json({ status: "error", message: error.message || "Server error" });
  }
};


//Get district_block_schools by contact numbers

export const GetDistrictBlockSchoolsByContact = async (req, res) => {

console.log("Hello get district blocks schools data")

const {callMadeTo, abrcContact, princiaplContact,beoContact, deoContact } = req.body;


console.log(req.body)

let contactNumber = {};

if (callMadeTo === "Principal"){

    contactNumber = {
        princiaplContact:princiaplContact
    }
} else if (callMadeTo === "ABRC"){

    contactNumber = {
        abrcContact:abrcContact
    }
} else if (callMadeTo === "DEO"){
    contactNumber = {
        deoContact:deoContact
    }
}   else if (callMadeTo === "BEO"){
    contactNumber = {
        beoContact:beoContact
    }
}

console.log(contactNumber)

    try {
        const response = await District_Block_School.find (contactNumber)


        res.status(200).json({status:"Ok", data: response})

    } catch (error) {
        
    }
}







export const UpdateCallLeads = async (req, res) => {
  try {
    const {
      _id,
      callType,
      callingStatus,
      callingRemark1,
      callingRemark2,
      mannualRemark,
      callingDate
    } = req.body;

    if (!_id || String(_id).trim() === "") {
      return res.status(400).json({ status: "error", message: "_id is required" });
    }

    // validate _id
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(String(_id));
    } catch (err) {
      return res.status(400).json({ status: "error", message: "Invalid _id" });
    }

    // Build update object only for provided fields
    const update = {};
    if (callType !== undefined) update.callType = callType;
    if (callingStatus !== undefined) update.callingStatus = callingStatus;
    if (callingRemark1 !== undefined) update.callingRemark1 = callingRemark1;
    if (callingRemark2 !== undefined) update.callingRemark2 = callingRemark2;
    if (mannualRemark !== undefined) update.mannualRemark = mannualRemark;
    if (callingDate !== undefined) {
      // allow null to clear date, or parse date string
      if (callingDate === null || callingDate === "") {
        update.callingDate = null;
      } else {
        const d = new Date(callingDate);
        if (isNaN(d.getTime())) {
          return res.status(400).json({ status: "error", message: "Invalid callingDate" });
        }
        update.callingDate = d;
      }
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ status: "error", message: "No updatable fields provided" });
    }

    // set updatedAt automatically by mongoose timestamps; use findByIdAndUpdate
    const updated = await CallLeads.findByIdAndUpdate(objectId, { $set: update }, { new: true }).lean();

    if (!updated) {
      return res.status(404).json({ status: "error", message: "CallLead not found" });
    }

    return res.status(200).json({ status: "oK", message: "CallLead updated", data: updated });
  } catch (error) {
    console.error("UpdateCallLeads error:", error);
    return res.status(500).json({ status: "error", message: error.message || "Server error" });
  }
};