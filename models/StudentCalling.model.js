import mongoose, { Schema } from "mongoose";

const StudentCallingSchema = new Schema(
  {
    // person who is making call
    CallerObjectId: {
      type: Schema.Types.ObjectId,
    },

    srn: { type: String },
    name: { type: String },
    father: { type: String },
    mobile: { type: String },
    whatsapp: { type: String },

    classOfStudent: { type: String },

    L2ExaminationDistrict: { type: String, default: null },
    L2ExaminationBlock: { type: String, default: null },
    L2ExaminationCenter: { type: String, default: null },
    L2ExaminationDate: { type: Date },

    omrcontact1: { type: String, default: null },
    omrcontact2: { type: String, default: null },

    callingStatus: { type: String, default: null }, 
    remark: { type: String, default: null },

    // 👇 NEW FIELD
    callingDate: {
      type: Date,
      default: Date.now
    },

    manualRemark: {type: String, default:null}
  },
  { timestamps: true }
);

export const StudentCalling =
  mongoose.models.StudentCalling ||
  mongoose.model("StudentCalling", StudentCallingSchema);
