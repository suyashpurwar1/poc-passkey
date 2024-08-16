const mongoose = require("mongoose");
const { Schema } = mongoose;

const passkeySchema = new Schema(
  {
    cred_id: {
      type: String,
      required: true,
      unique: true,
    },
    cred_public_key: {
      type: Buffer,
      required: true,
    },
    internal_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    passkey_user_id: {
      type: String,
      required: true,
    },
    counter: {
      type: Number,
      required: true,
    },
    deviceType: {
      type: String,
      default: "",
    },
    backed_up: {
      type: Boolean,
    },
    name: {
      type: String,
      default: "",
    },
    transports: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Add indexes
passkeySchema.index({ cred_id: 1 }, { unique: true });
passkeySchema.index({ passkey_user_id: 1 });

const Passkey = mongoose.model("Passkey", passkeySchema);

module.exports = Passkey;
