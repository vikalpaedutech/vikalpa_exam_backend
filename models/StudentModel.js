//Defining student model.

import mongoose, { Schema } from "mongoose";


// const StudentSchema = new Schema(
//   {
//    srn: { type: String, unique: true, required: true },
//     name: { type: String, required: true },
//     father: { type: String, required: true },
//     mother: { type: String, required: true },
//     dob: { type: String, required: true },
//     gender: { type: String, required: true },
//     category: { type: String, required: true },
//     aadhar: { type: String, unique: true, required: true },
//     mobile: { type: String, required: true },
//     whatsapp: { type: String, required: true },

//     //Student personal adress
//     houseNumber: {type: String},
//     cityTownVillage: {type: String, required: true},
//     addressBlock: {type: String, required: true},
//     addressDistrict: {type:String, required: true},
//     addressState: {type: String, required: true},


//     //^^^^^^^^^^^^^^^^^


//     ///Student school address
//     // address: { type: String, required: true },
//     schoolDistrict: { type: String, required: true },
//     schoolBlock: { type: String, required: true },
//     school: { type: String, required: true },
//     schoolCode: {type: String},
    
//     //added on nov
//     previousClassAnnualExamPercentage:{type: String},

//     //^^^^^^^^^^^^^^^^^^^
//     classOfStudent: { type: String}, // 
//     image: { type: String }, // Assuming this is a file path or base64 string
//     imageUrl: { type: String }, // URL to the image

//     //Verification status
//     isRegisteredBy: { type: String }, // Could represent the user or admin who registered the student
//     isVerified: {type:String , default:"Pending"}, //Sends the verification status of student form as pending.
//     verifiedBy: { type: String }, // Could represent the user or admin who verified the student
//     registrationFormVerificationRemark: {type: String, default: null},
//     slipId: {type: String}, //Genereates dynamic acknowledgment id for the login of the students.


//     rollNumber: { type: String },
//    //Below for admit card status
//     isL1AdmitCardDownloaded: {type: Boolean, default: false},
//     isL2AdmitCardDownloaded: {type: Boolean, default: false},
//     isL3AdmitCardDownloaded: {type: Boolean, default: false},



//     //Below are for examination
  
//     L1ExaminationDistrict: {type: String},
//     L1ExaminationBlock: {type: String},
//     L1ExaminationCenter: {type: String},
//     L1ExaminationDate: {type: Date},

//     L2ExaminationDistrict: {type: String},
//     L2ExaminationBlock: {type: String},
//     L2ExaminationCenter: {type: String},
//     L2ExaminationDate: {type: Date},


//     L3ExaminationDistrict: {type: String},
//     L3ExaminationBlock: {type: String},
//     L3ExaminationCenter: {type: String},
//     L3ExaminationDate: {type: Date},
   
  

//     examType: { type: String },


 
//     L1ResultDownloaded: { type: Boolean, default: false },
//     L2ResultDownloaded: { type: Boolean, default: false },
//     L3ResultDownloaded: { type: Boolean, default: false },
  

//     L1Mark: { type: Number },
//     L2Mark: { type: Number },
//     L3Mark: { type: Number },

 
//     L1Qualified: { type: Boolean, default: false },
//     L2Qualified: { type: Boolean, default: false },
//     L3Qualified: { type: Boolean, default: false },


    
    
//     isPresentInL1Examination: {type: Boolean, default: false},
//     isPresentInL2Examination: {type: Boolean, default: false},
//     isPresentInL3Examination: {type: Boolean, default: false},

//     //Super 100
//     roomNo: {type: Number, default:null},
//     bedNo: {type: Number, default:null},
//     s100L2RollNumber:{type: String, default:null},
//     finalShortListOrWaitListStudents: {type: String, default:null},
//     selectedBoard:{type: String, default:null},
//     selectedSchool:{type: String, default:null},
//     homeToSchoolDistance:{type: Number, default:0},
//     counsellingAdmitCardDownloaded: {type: Boolean, default: false},
//     counsellingAttendance: {type: Boolean, default: false},
//     counsellingToken: {type: String, default: 0},
//     documents: {type: Object, default:{
//       twoPassportPhoto: 0,
//       aadharCardCopy: 0,
//       parentAadhar: 0,
//       ppp: 0,
//       slc: 0
//     } },

//     counsellingCenterAllocation: {type: String, default:null},
//     admissionStatus: {type: String, default:null}

//   },
//   { timestamps: true }
// );











const StudentSchema = new Schema(
  {
   srn: { type: String, unique: true,  },
    name: { type: String,  },
    father: { type: String,  },
    mother: { type: String,  },
    dob: { type: Date,  },
    gender: { type: String,  },
    category: { type: String,  },
    aadhar: { type: String,   },
    mobile: { type: String,  },
    whatsapp: { type: String,  },

    //Student personal adress
    houseNumber: {type: String},
    cityTownVillage: {type: String, },
    addressBlock: {type: String, },
    addressDistrict: {type:String, },
    addressState: {type: String, },


    //^^^^^^^^^^^^^^^^^


    ///Student school address
    // address: { type: String,  },
    schoolDistrict: { type: String,  },
    schoolDistrictCode: {type: String,},
    schoolBlock: { type: String,  },
    schoolBlockCode: { type: String,  },
    school: { type: String,  },
    schoolCode: {type: String},
    
    //added on nov
    previousClassAnnualExamPercentage:{type: String},

    //^^^^^^^^^^^^^^^^^^^
    classOfStudent: { type: String}, // 
    image: { type: String, default:'Not uploaded' }, // Assuming this is a file path or base64 string
    imageUrl: { type: String, default:'Not uploaded' }, // URL to the image

    //Verification status
    isRegisteredBy: {   type: String, // reference to User
                
                  default: null
                }, // Could represent the user or admin who registered the student
    isBulkRegistered: {type:Boolean, default:false},
    isVerified: {type:String , default:"Pending"}, //Sends the verification status of student form as pending.
    verifiedBy: { type: String, default: null }, // Could represent the user or admin who verified the student
    registrationFormVerificationRemark: {type: String, default: null},
    slipId: {type: String, default:null}, //Genereates dynamic acknowledgment id for the login of the students.


    rollNumber: { type: String, default: null },
   //Below for admit card status
    isL1AdmitCardDownloaded: {type: Boolean, default: false},
    isL2AdmitCardDownloaded: {type: Boolean, default: false},
    isL3AdmitCardDownloaded: {type: Boolean, default: false},



    //Below are for examination
  

    L1ExaminationDistrict: {type: String, default:null},
    L1ExaminationBlock: {type: String, default: null},
    L1ExaminationCenter: {type: String, default:null},
    L1ExaminationDate: {type: Date, default: null},

    L2ExaminationDistrict: {type: String, default:null},
    L2ExaminationBlock: {type: String, default:null},
    L2ExaminationCenter: {type: String, default:null},
    L2ExaminationDate: {type: Date},


    L3ExaminationDistrict: {type: String},
    L3ExaminationBlock: {type: String},
    L3ExaminationCenter: {type: String},
    L3ExaminationDate: {type: Date},
   
  

    examType: { type: String },


 
    L1ResultDownloaded: { type: Boolean, default: false },
    L2ResultDownloaded: { type: Boolean, default: false },
    L3ResultDownloaded: { type: Boolean, default: false },
  

    L1Mark: { type: Number },
    L2Mark: { type: Number },
    L3Mark: { type: Number },

 
    L1Qualified: { type: Boolean, default: false },
    L2Qualified: { type: Boolean, default: false },
    L3Qualified: { type: Boolean, default: false },


    
    
    isPresentInL1Examination: {type: Boolean, default: false},
    isPresentInL2Examination: {type: Boolean, default: false},
    isPresentInL3Examination: {type: Boolean, default: false},

    //Super 100
    roomNo: {type: Number, default:null},
    bedNo: {type: Number, default:null},
    s100L2RollNumber:{type: String, default:null},
    finalShortListOrWaitListStudents: {type: String, default:null},
    selectedBoard:{type: String, default:null},
    selectedSchool:{type: String, default:null},
    homeToSchoolDistance:{type: Number, default:0},
    counsellingAdmitCardDownloaded: {type: Boolean, default: false},
    counsellingAttendance: {type: Boolean, default: false},
    counsellingToken: {type: String, default: 0},
    documents: {type: Object, default:{
      twoPassportPhoto: 0,
      aadharCardCopy: 0,
      parentAadhar: 0,
      ppp: 0,
      slc: 0
    } },

    counsellingCenterAllocation: {type: String, default:null},
    admissionStatus: {type: String, default:null},
    registrationDate: {type: Date, default:null},
    formCorrectionBy: {type: String, default:null},
    correctedFields: {type: String, default: null},

    

  },
  { timestamps: true }
);
// export const Student =  mongoose.model("Student", StudentSchema);


export const Student = mongoose.models.Student || mongoose.model("Student", StudentSchema);
