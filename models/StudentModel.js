const mongoose = require("mongoose");
const { BundleCloneListInstance } = require("twilio/lib/rest/numbers/v2/bundleClone");

const studentSchema = new mongoose.Schema(
  {
    srn: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    father: { type: String, required: true },
    mother: { type: String, required: true },
    dob: { type: String, required: true },
    gender: { type: String, required: true },
    category: { type: String, required: true },
    aadhar: { type: String, unique: true, required: true },
    mobile: { type: String, required: true },
    whatsapp: { type: String, required: true },

    //Added pm 7 mov
    houseNumber: {type: String},
    cityTownVillage: {type: String, required: true},
    addressBlock: {type: String, required: true},
    addressDistrict: {type:String, required: true},
    addressState: {type: String, required: true},


    //^^^^^^^^^^^^^^^^^



    // address: { type: String, required: true },
    district: { type: String, required: true },
    block: { type: String, required: true },
    school: { type: String, required: true },
    schoolCode: {type: String},
    

    //added on nov

    previousClassAnnualExamPercentage:{type: String},

    //^^^^^^^^^^^^^^^^^^^
    grade: { type: String}, // 
    image: { type: String }, // Assuming this is a file path or base64 string
    imageUrl: { type: String }, // URL to the image
    isRegisteredBy: { type: String }, // Could represent the user or admin who registered the student
    isVerified: {type:String , default:"Pending"}, //Sends the verification status of student form as pending.
    isVerifiedBy: { type: String }, // Could represent the user or admin who verified the student
    slipId: {type: String}, //Genereates dynamic acknowledgment id for the login of the students.
    rollNumber: { type: String },
    L1districtAdmitCard: {type: String},
    examType: { type: String },
    centerAllocation1: { type: String },
    centerAllocation2: { type: String },
    centerAllocation3: { type: String },
    dateL1: { type: Date },
    dateL12: { type: Date },
    dateL3: { type: Date },
    admitCard1: { type: Boolean, default: false },
    admitCard2: { type: Boolean, default: false },
    admitCard3: { type: Boolean, default: false },
    resultStatus1: { type: Boolean, default: false },
    resultStatus2: { type: Boolean, default: false },
    resultStatus3: { type: Boolean, default: false },
    marksL1: { type: Number },
    marksL2: { type: Number },
    marksL3: { type: Number },
    isQualifiedL1: { type: Boolean, default: false },
    isQualifiedL2: { type: Boolean, default: false },
    isQualifiedL3: { type: Boolean, default: false },
    verificationRemark: {type: String, default: null},
    verifiedBy: {type: String, default: null},
    isPresentInL3Examination: {type: Boolean, default: false},
    isPresentInL2Examination: {type: Boolean, default: false},
    roomNo: {type: Number},
    bedNo: {type: Number},
    s100L2RollNumber:{type: String},
    finalShortListOrWaitListStudents: {type: String},
    selectedBoard:{type: String},
    selectedSchool:{type: String},
    homeToSchoolDistance:{type: String},
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

    counsellingCenterAllocation: {type: String},
    admissionStatus: {type: String}

  },
  { timestamps: true }
);

// Create a model from the schema
const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
