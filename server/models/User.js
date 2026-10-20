const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false, // Prevents returning password by default in queries
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'interviewer'],
    required: [true, 'Role is required'],
  },
  skillRating: {
    type: Number,
    default: 1000,
    min: [100, 'Skill rating cannot be less than 100'],
    max: [3000, 'Skill rating cannot exceed 3000'],
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to safely return user object without sensitive data
userSchema.methods.toSafeObject = function() {
  const userObj = this.toObject();
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
