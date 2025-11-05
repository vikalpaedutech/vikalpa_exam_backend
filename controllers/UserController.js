import mongoose from "mongoose";
import {User, UserAccess} from "../models/UserModel.js"

export const createOrUpdateUser = async (req, res) => {
  const payloadUser = req.body.user || {};
  const payloadAccess = req.body.userAccess || {};

console.log(req.body.userAccess)


  // Basic validation
  if (!payloadUser.userName || !payloadUser.designation || !payloadUser.mobile) {
    return res.status(400).json({
      ok: false,
      message: "user.userName, user.designation and user.mobile are required",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let userDoc;

    // Determine whether to update existing user:
    // Priority: payloadUser._id -> update by id
    // Otherwise try to find by mobile (unique)
    if (payloadUser._id) {
      // remove _id from update object to avoid immutable field issue
      const { _id, ...updates } = payloadUser;
      userDoc = await User.findByIdAndUpdate(_id, updates, {
        new: true,
        session,
        runValidators: true,
      });
      if (!userDoc) {
        // If _id provided but not found, create new
        userDoc = await User.create([payloadUser], { session }).then(r => r[0]);
      }
    } else {
      // Try find by mobile
      userDoc = await User.findOne({ mobile: payloadUser.mobile }).session(session);
      if (userDoc) {
        // update
        userDoc = await User.findByIdAndUpdate(userDoc._id, payloadUser, {
          new: true,
          session,
          runValidators: true,
        });
      } else {
        // create new user
        userDoc = await User.create([payloadUser], { session }).then(r => r[0]);
      }
    }

    // Ensure we have userDoc and its _id
    if (!userDoc || !userDoc._id) {
      throw new Error("Failed to create or load user");
    }

    // Prepare UserAccess payload: ensure unqUserObjectId is set to userDoc._id
    const accessPayload = {
      ...payloadAccess,
      unqUserObjectId: userDoc._id,
    };

    // Upsert UserAccess for this user
    const userAccessDoc = await UserAccess.findOneAndUpdate(
      { unqUserObjectId: userDoc._id },
      accessPayload,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        session,
        runValidators: true,
      }
    );

    await session.commitTransaction();
    session.endSession();

    // Remove password before sending back
    const userToReturn = userDoc.toObject();
    if (userToReturn.password) delete userToReturn.password;

    return res.status(200).json({
      ok: true,
      message: "User and UserAccess created/updated successfully",
      user: userToReturn,
      userAccess: userAccessDoc,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    // Detect duplicate mobile error
    if (err.code === 11000 && err.keyPattern && err.keyPattern.mobile) {
      return res.status(409).json({
        ok: false,
        message: "Mobile number already in use",
        detail: err.message,
      });
    }

    console.error("createOrUpdateUser error:", err);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};






//Get api.


// Get User + UserAccess by user _id (taken from req.body)
export const getUserWithAccessById = async (req, res) => {
  try {
    const id = req.body._id || req.body.id;
    if (!id) {
      return res.status(400).json({
        ok: false,
        message: "Please provide user _id in request body as `_id` or `id`",
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid user _id",
      });
    }

    // Fetch user
    const userDoc = await User.findById(id).lean();
    if (!userDoc) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    // Remove password before returning
    if (userDoc.password) delete userDoc.password;

    // Fetch userAccess by unqUserObjectId
    const userAccessDoc = await UserAccess.findOne({
      unqUserObjectId: id,
    }).lean();

    return res.status(200).json({
      ok: true,
      user: userDoc,
      userAccess: userAccessDoc || null,
    });
  } catch (err) {
    console.error("getUserWithAccessById error:", err);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};







// Get User + UserAccess by mobile and password
export const getUserWithMobileAndPassword = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // Basic validation
    if (!mobile || !password) {
      return res.status(400).json({
        ok: false,
        message: "Please provide both mobile and password in request body",
      });
    }

    // Find user by mobile
    const userDoc = await User.findOne({ mobile }).lean();
    if (!userDoc) {
      return res.status(404).json({
        ok: false,
        message: "User not found with this mobile number",
      });
    }

    // Check password
    if (userDoc.password !== password) {
      return res.status(401).json({
        ok: false,
        message: "Incorrect password",
      });
    }

    // Remove password before sending
    if (userDoc.password) delete userDoc.password;

    // Fetch UserAccess
    const userAccessDoc = await UserAccess.findOne({
      unqUserObjectId: userDoc._id,
    }).lean();

    return res.status(200).json({
      ok: true,
      message: "User login successful",
      user: userDoc,
      userAccess: userAccessDoc || null,
    });
  } catch (err) {
    console.error("getUserWithMobileAndPassword error:", err);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};




export const changePasswordUsingMobile = async (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ message: "mobile and password are required" });
  }

  try {
    const response = await User.findOneAndUpdate(
      { mobile: mobile },
      { $set: { password: password } },
      { new: true } // return the updated document
    );

    if (!response) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Password updated successfully", user: response });
  } catch (error) {
    console.error("changePasswordUsingMobile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};