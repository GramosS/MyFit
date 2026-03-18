import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);

