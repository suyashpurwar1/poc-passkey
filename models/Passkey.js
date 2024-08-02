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
    counter: {
      type: Number,
      required: true,
    },
    deviceType:{
      type:String,
      default:"",
    },
    backUp:{
      type:Boolean,
    }

  },
  { timestamps: true }
);

const Passkey = mongoose.model("Passkey", passkeySchema);

module.exports = Passkey;
