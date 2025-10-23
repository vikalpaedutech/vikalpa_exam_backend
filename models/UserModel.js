const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    userName: {type: String, required: true},
    designation: {type: String, required: true},
    mobile: {type: String, required: true, unique: true},
    district: {type: String, required: true},
    block: {type:String, required: true},
    school: {type: String},
    schoolCode: {type: String},
    password: {type: String}

},{timestamps:true});

//Create a model from the schema.

const User = mongoose.model("User", UserSchema);

module.exports = User;


