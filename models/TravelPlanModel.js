import mongoose, { Schema } from "mongoose";

const TravelPlanSchema = new Schema(
  {
    date: {type: Date},
    district:{type: String},
    block: {type: String},
    eventUpdate: {type: String},
    venue: {type: String},
    officeStaff: {type: String},
    contactOfficeStaff: {type: String},
    sdm: {type: String},
    deo: {type: String},
    beo: {type: String},
    
    
  },

  { timestamps: true }
);
// export const Student =  mongoose.model("Student", StudentSchema);


export const TravelPlan = mongoose.models.TravelPlan || mongoose.model("TravelPlan", TravelPlanSchema);




