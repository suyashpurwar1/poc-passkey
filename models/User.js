const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    passkey_user_id: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

// Add indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ user_id: 1 }, { unique: true });
userSchema.index({ passkey_user_id: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
