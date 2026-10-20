const mongoose = require('mongoose');

const ratingLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, 'Question reference is required']
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },
  idempotencyKey: {
    type: String,
    index: true,
    sparse: true
  },
  previousRating: {
    type: Number,
    required: true
  },
  newRating: {
    type: Number,
    required: true
  },
  ratingDelta: {
    type: Number,
    required: true
  },
  expectedScore: {
    type: Number,
    required: true
  },
  questionDifficulty: {
    type: Number,
    required: true
  },
  result: {
    type: Number,
    enum: [0, 1],
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  kFactor: {
    type: Number,
    default: 32
  },
  responseTime: {
    type: Number
  },
  confidence: {
    type: String
  }
}, { timestamps: true });

// Compound index for user and idempotencyKey
ratingLogSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

const RatingLog = mongoose.model('RatingLog', ratingLogSchema);
module.exports = RatingLog;
