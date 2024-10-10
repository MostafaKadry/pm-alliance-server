const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define user schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: function () {
      return !this.linkedinId; // Password is required only if linkedinId is not present
    },
  },
  linkedinId: { type: String },  // For LinkedIn login
});


// Pre-save hook to hash the password, but only if it exists
userSchema.pre('save', async function (next) {
  if (this.password && this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error); // Handle bcrypt error
    }
  }
  next();
});
const User = mongoose.model('User', userSchema);
module.exports = User;
