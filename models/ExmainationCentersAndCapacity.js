//Defining student model.

import mongoose, { Schema } from "mongoose";

const ExaminationCentersAndCapacitySchema = new Schema(
  {
    districtId:{type: String, default: null},
    districtName:{type: String, default: null},
    blockId:{type: String, default: null},
    blockName:{type: String, default: null},
    examinationVenueCode:{type: String, default: null},
    examinationVenue:{type: String, default: null},
    capacity: {type:Number, default: 0},
    studentDistributionCount: {type:Number, default: 0},
    remaining: {type: Number, default: 0},
    examType: {type: String, default: null},
    examinationLevel: {type: String, default: null},
    requiredPaperCount: {type: Number, default: 0},
    examinationVenueSequenceInBlock: {type: String},
    
  },
  { timestamps: true }
);
// export const Student =  mongoose.model("Student", StudentSchema);


export const ExaminationCentersAndCapacity = mongoose.models.ExaminationCentersAndCapacity || mongoose.model("ExaminationCentersAndCapacity", ExaminationCentersAndCapacitySchema);
