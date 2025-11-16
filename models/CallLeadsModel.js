import mongoose, { Schema } from "mongoose";

const CallLeadsSchema = new Schema(
  {
    
  objectIdOfCalledPerson: {
              type: mongoose.Schema.Types.ObjectId, // reference to User
              ref: "User",
              required: true,
            },
    
    objectIdOfCaller: {  type: mongoose.Schema.Types.ObjectId, // reference to User
              
            default: null},
    callMadeTo: {type: String}, //ABRC Callings, Deo , BEO, Principals,  Students...
    districtId:{type: String},
    blockId:{type: String},
    centerId: {type: String},
    callType: {type: String,  default: null}, //informative, principal, deo, beo, result, admit card
    callingStatus: {type: String,  default: null }, //Connected/Not connected
    callingRemark1: {type: String,   default: null},
    callingRemark2: {type: String,  default: null},
    mannualRemark: {type: String,  default: null},
    callingDate: {type: Date,  default: null}
  

  },

  { timestamps: true }
);





export const CallLeads = mongoose.models.CallLeads || mongoose.model("CallLeads", CallLeadsSchema);
