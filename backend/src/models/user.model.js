import mongoose from "mongoose";

const userSchema =new mongoose.Schema({
  name: {
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
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },storageUsed: {
      type: Number,
      default: 0
    },
    storageLimit: {
      type: Number,
      default: 1024 * 1024 * 1024 * 5
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;