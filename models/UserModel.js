import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    userName: {type: String, required: true},
    designation: {type: String, required: true},
    mobile: {type: String, required: true, unique: true},
    password: {type: String}

  },

  { timestamps: true }
);
// export const Student =  mongoose.model("Student", StudentSchema);


export const User = mongoose.models.User || mongoose.model("User", UserSchema);









//User Access. assigning district, block, schools to users.

const UserAccessSchema = new Schema(
  {

unqUserObjectId: {
              type: mongoose.Schema.Types.ObjectId, // reference to User
              ref: "User",
              required: true,
            },
  region: [
      {
        _id: false,
        districtId: { type: String },
        blockIds: [
          {
            _id: false,
            blockId: { type: String },
            schoolIds: [
              {
                _id: false,
                schoolId: { type: String },
              },
            ],
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export const UserAccess = mongoose.models.UserAccess || mongoose.model("UserAccess", UserAccessSchema);
