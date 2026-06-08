import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// A "schema" is the shape of a record in the database.
// This describes what a User looks like.
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // no two users can share an email
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    // We'll use this later for permissions (admin vs normal member).
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
  },
  { timestamps: true } // automatically adds createdAt / updatedAt
);

// Before a user is saved, automatically scramble (hash) their password
// so we never store the real password text in the database.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// A helper to check a typed password against the stored hashed one.
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
