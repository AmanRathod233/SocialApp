import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const instagramSchema = new mongoose.Schema({
  igId: String,
  username: String,
  pageId: String,           // ✅ Link to Facebook Page ID
  accessToken: String,      // ✅ Same as page's access token
}, { _id: false });

const pageSchema = new mongoose.Schema({
  id: String,
  name: String,
  accessToken: String,
}, { _id: false });

const metaSchema = new mongoose.Schema({
  accessToken: String,
  metaUserId: String, // Facebook user ID
  name: String,
  email: String,
  connectedAt: Date,
  pages: [pageSchema],            // ✅ multiple pages
  instagram: [instagramSchema],   // ✅ multiple IG accounts linked to pages
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    meta: metaSchema,
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
