import mongoose, { Schema } from "mongoose";








//User Access. assigning district, block, schools to users.

const CallLogsSchema = new Schema(
  {

    
    callerId: {
                  type: mongoose.Schema.Types.ObjectId, // reference to User
                  ref: "User",
                  required: true,
                },  //id of uer who makes the calls

    districtId: { type: String, default:null },
    districtName: { type: String, default:null},
    blockId: {type: String, default:null},
    blockName: {type: String, default:null},
    centerId: {type: String, default:null},
    centerName: {type: String, default:null},
    schoolType: {type: String, default:null},//For separating buniyaad centers and haryana schools

    abrc: {type: String, default: null},
    calledTo: {type: String, default:null}, //principal, abrc, beo, deo
    abrcContact: {type: String, default:null},
    principal: {type: String, default: null },
    princiaplContact: {type: String, default: null},
    principalAbrcDataUpdatedBy: {type: String, default:null},
    beo: {type: String, default: null},
    beoContact: {type: String, default:null},
    deo: {type: String, default: null},
     deoContact: {type: String, default:null},

    callingStatus: {type: String, default:null}, //Connected, not connected.
    callingRemark: {type: String, default:null}, //Remark blc, registration.
    manualRemark: {type: String, default:null},



  },

  { timestamps: true }

);

export const CallLog = mongoose.models.CallLog || mongoose.model("CallLog", CallLogsSchema);
