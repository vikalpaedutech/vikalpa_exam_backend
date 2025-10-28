const mongoose = require("mongoose");

const PrincipalSchoolsAbrcDataCollectionSchema = new mongoose.Schema({
    district: {type: String, },
    block: {type: String, },
    scholType: {type:String, }, //Model, middle, high, senior secondary, Aarohi
    school: {type: String, },
    principal: {type: String, },
    principalContact: {type: String},
    alternateSchoolNumber: {type: String},
    abrcName: {type: String},
    abrcAssignedSchools: {type: String},
    abrcContact: {type: String},
    abrcAlternateContact: {type: String},
    dataType: {type: String}, //School details or ABRC Details
    dataFilledBy: { type: mongoose.Schema.Types.ObjectId }



},{timestamps:true});

//Create a model from the schema.

const PrincipalSchoolsAbrcDataCollection = mongoose.model("PrincipalSchoolsAbrcDataCollection", PrincipalSchoolsAbrcDataCollectionSchema);

module.exports = PrincipalSchoolsAbrcDataCollection;





