const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  domain: {
    type: String,
    trim: true,
    default: 'General'
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
  },
  difficulty: {
    type: String,
    enum: {
      values: ['beginner', 'intermediate', 'advanced', 'adaptive'],
      message: '{VALUE} is not a valid quiz difficulty level'
    },
    default: 'intermediate'
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  totalMarks: {
    type: Number,
    default: 0,
    min: [0, 'Total marks cannot be negative']
  },
  timeLimit: {
    type: Number, // in minutes
    default: 30,
    min: [1, 'Time limit must be at least 1 minute']
  },
  passingScore: {
    type: Number, // percentage (e.g. 60%)
    default: 60,
    min: [0, 'Passing score cannot be negative'],
    max: [100, 'Passing score cannot exceed 100']
  },
  isAdaptive: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'published', 'archived'],
      message: '{VALUE} is not a valid quiz status'
    },
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  }
}, { timestamps: true });

quizSchema.index({ createdBy: 1, status: 1 });
quizSchema.index({ topic: 1, status: 1 });
quizSchema.index({ status: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz;
