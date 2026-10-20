const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  }
}, { _id: true });

const questionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Question content is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: {
      values: ['multiple_choice', 'single_choice', 'true_false'],
      message: '{VALUE} is not a valid question type'
    },
    default: 'multiple_choice',
  },
  options: {
    type: [optionSchema],
    validate: [
      {
        validator: function (options) {
          return Array.isArray(options) && options.length >= 2;
        },
        message: 'A question must have at least 2 options'
      },
      {
        validator: function (options) {
          return Array.isArray(options) && options.some(opt => opt.isCorrect === true);
        },
        message: 'At least one option must be marked as correct'
      }
    ],
    required: [true, 'Options are required']
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
    type: Number,
    required: [true, 'Difficulty rating is required'],
    default: 1000,
    min: [100, 'Difficulty cannot be less than 100'],
    max: [3000, 'Difficulty cannot be greater than 3000']
  },
  difficultyLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  marks: {
    type: Number,
    default: 1,
    min: [1, 'Marks must be at least 1']
  },
  explanation: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  }
}, { timestamps: true });

// Pre-save hook to ensure difficultyLevel matches difficulty rating if not explicitly overridden
questionSchema.pre('save', function () {
  if (this.isModified('difficulty') && !this.isModified('difficultyLevel')) {
    if (this.difficulty < 800) {
      this.difficultyLevel = 'easy';
    } else if (this.difficulty > 1200) {
      this.difficultyLevel = 'hard';
    } else {
      this.difficultyLevel = 'medium';
    }
  }
});

// Indexes for query performance and adaptive filtering
questionSchema.index({ topic: 1, difficulty: 1 });
questionSchema.index({ createdBy: 1 });
questionSchema.index({ domain: 1, topic: 1 });

// Helper method to sanitize question for students (stripping isCorrect and explanation)
questionSchema.methods.toStudentSafeObject = function () {
  const obj = this.toObject();
  if (obj.options && Array.isArray(obj.options)) {
    obj.options = obj.options.map(opt => ({
      _id: opt._id,
      text: opt.text
    }));
  }
  delete obj.explanation;
  return obj;
};

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
