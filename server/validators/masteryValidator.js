const mongoose = require('mongoose');

const validateRecordMastery = (req, res, next) => {
  const { topic, domain, isCorrect, userRating } = req.body;
  const errors = [];

  if (!topic || typeof topic !== 'string' || topic.trim() === '') {
    errors.push('Topic is required');
  }

  if (domain !== undefined && typeof domain !== 'string') {
    errors.push('Domain must be a string');
  }

  const validBooleanOrBinary = [true, false, 1, 0, '1', '0'];
  if (isCorrect === undefined || !validBooleanOrBinary.includes(isCorrect)) {
    errors.push('isCorrect must be a boolean or 1/0');
  }

  if (userRating !== undefined) {
    const ratingNum = Number(userRating);
    if (isNaN(ratingNum) || ratingNum < 100 || ratingNum > 3000) {
      errors.push('userRating must be a number between 100 and 3000');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors
    });
  }

  next();
};

const validateUserId = (req, res, next) => {
  const { userId } = req.params;
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid userId format'
    });
  }
  next();
};

module.exports = {
  validateRecordMastery,
  validateUserId
};
