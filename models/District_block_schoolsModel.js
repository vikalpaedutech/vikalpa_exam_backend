//Holds the districtBlockBuniyaadCenters data schema

import mongoose, { Schema } from "mongoose";

const DistrictBlockBuniyaadCenterSchema = new Schema(
  
  {
    districtId: { type: String },
    districtName: { type: String},
    blockId: {type: String},
    blockName: {type: String},
    centerId: {type: String},
    centerName: {type: String},
    schoolType: {type: String},//For separating buniyaad centers and haryana schools
    
    isCluster: {type: Boolean, default: false},
    abrc: {type: String, default: null},
    abrcContact: {type: String, default:null},
    principal: {type: String, default: null },
    princiaplContact: {type: String, default: null},
    principalAbrcDataUpdatedBy: {type: String, default:null},

     beo: {type: String, default: null},
    beoContact: {type: String, default:null},
    deo: {type: String, default: null},
     deoContact: {type: String, default:null},

    centerPreference1: {type: String, default: null},
    centerPreference2: {type: String, default: null},
    centerPrefrenceFilledBy: {type: String, default: null}
  }
  ,
  { timestamps: true }
);

export const District_Block_School =  mongoose.model("District_Block_School", DistrictBlockBuniyaadCenterSchema);