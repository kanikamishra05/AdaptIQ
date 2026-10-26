const mongoose = require('mongoose');

const masterySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  domain: {
    type: String,
    default: 'General',
    trim: true
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true
  },
  questionsAttempted: {
    type: Number,
    default: 0,
    min: [0, 'Questions attempted cannot be negative']
  },
  questionsCorrect: {
    type: Number,
    default: 0,
    min: [0, 'Questions correct cannot be negative']
  },
  accuracy: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  masteryScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastAttemptedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound unique index ensuring one mastery record per user per topic
masterySchema.index({ user: 1, topic: 1 }, { unique: true });
masterySchema.index({ topic: 1, masteryScore: 1 });
masterySchema.index({ domain: 1, topic: 1 });

/**
 * Helper to update accuracy and masteryScore based on attempts and skill rating
 */
masterySchema.methods.updateMasteryMetrics = function (userRating = 1000) {
  if (this.questionsAttempted > 0) {
    this.accuracy = Math.round((this.questionsCorrect / this.questionsAttempted) * 10000) / 100;
  } else {
    this.accuracy = 0;
  }

  // Rating score normalized to 0-100 scale (range 600 to 2000 Elo)
  const normalizedRatingScore = Math.min(100, Math.max(0, ((userRating - 600) / 1400) * 100));

  // Mastery score combines accuracy (60%) and normalized rating proficiency (40%)
  const rawMastery = (0.6 * this.accuracy) + (0.4 * normalizedRatingScore);
  this.masteryScore = Math.round(rawMastery * 100) / 100;
  this.lastAttemptedAt = new Date();
};

const Mastery = mongoose.model('Mastery', masterySchema);
module.exports = Mastery;
