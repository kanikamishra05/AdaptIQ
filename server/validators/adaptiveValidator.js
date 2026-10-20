const mongoose = require('mongoose');

const validateCalculateRating = (req, res, next) => {
  const { userRating, questionDifficulty, result, kFactor, responseTime, expectedTime } = req.body;
  const errors = [];

  if (userRating === undefined || typeof Number(userRating) !== 'number' || isNaN(Number(userRating))) {
    errors.push('userRating must be a valid number');
  } else if (Number(userRating) < 100 || Number(userRating) > 3000) {
    errors.push('userRating must be between 100 and 3000');
  }

  if (questionDifficulty === undefined || typeof Number(questionDifficulty) !== 'number' || isNaN(Number(questionDifficulty))) {
    errors.push('questionDifficulty must be a valid number');
  } else if (Number(questionDifficulty) < 100 || Number(questionDifficulty) > 3000) {
    errors.push('questionDifficulty must be between 100 and 3000');
  }

  const validResults = [0, 1, '0', '1', true, false];
  if (result === undefined || !validResults.includes(result)) {
    errors.push('result must be 1 (correct) or 0 (incorrect)');
  }

  if (kFactor !== undefined) {
    const k = Number(kFactor);
    if (isNaN(k) || k <= 0 || k > 100) {
      errors.push('kFactor must be a positive number between 1 and 100');
    }
  }

  if (responseTime !== undefined) {
    const rt = Number(responseTime);
    if (isNaN(rt) || rt < 0) {
      errors.push('responseTime must be a non-negative number');
    }
  }

  if (expectedTime !== undefined) {
    const et = Number(expectedTime);
    if (isNaN(et) || et <= 0) {
      errors.push('expectedTime must be a positive number');
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

const validateEvaluate = (req, res, next) => {
  const { questionId, selectedOptionId, quizId, answeredQuestionIds, responseTime, confidence } = req.body;
  const errors = [];

  if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
    errors.push('A valid questionId is required');
  }

  if (!selectedOptionId || typeof selectedOptionId !== 'string' || selectedOptionId.trim() === '') {
    errors.push('selectedOptionId is required');
  }

  if (quizId && !mongoose.Types.ObjectId.isValid(quizId)) {
    errors.push('quizId has an invalid ID format');
  }

  if (answeredQuestionIds !== undefined) {
    if (!Array.isArray(answeredQuestionIds)) {
      errors.push('answeredQuestionIds must be an array of IDs');
    } else {
      const invalid = answeredQuestionIds.some(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalid) {
        errors.push('One or more answeredQuestionIds have an invalid ID format');
      }
    }
  }

  if (responseTime !== undefined) {
    const rt = Number(responseTime);
    if (isNaN(rt) || rt < 0) {
      errors.push('responseTime must be a non-negative number');
    }
  }

  if (confidence !== undefined) {
    const validConf = ['low', 'medium', 'high'];
    if (!validConf.includes(confidence.toLowerCase())) {
      errors.push('confidence must be one of: low, medium, high');
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

const validateNextQuestion = (req, res, next) => {
  const { quizId, answeredQuestionIds, targetRating } = req.body;
  const errors = [];

  if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
    errors.push('A valid quizId is required');
  }

  if (answeredQuestionIds !== undefined) {
    if (!Array.isArray(answeredQuestionIds)) {
      errors.push('answeredQuestionIds must be an array of IDs');
    } else {
      const invalid = answeredQuestionIds.some(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalid) {
        errors.push('One or more answeredQuestionIds have an invalid ID format');
      }
    }
  }

  if (targetRating !== undefined) {
    const tr = Number(targetRating);
    if (isNaN(tr) || tr < 100 || tr > 3000) {
      errors.push('targetRating must be a number between 100 and 3000');
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

module.exports = {
  validateCalculateRating,
  validateEvaluate,
  validateNextQuestion
};
