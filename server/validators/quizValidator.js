const mongoose = require('mongoose');

const validateCreateQuiz = (req, res, next) => {
  const { title, topic, difficulty, questions, status, timeLimit, passingScore, isAdaptive } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Quiz title must be at least 3 characters long');
  } else if (title.trim().length > 200) {
    errors.push('Quiz title cannot exceed 200 characters');
  }

  if (!topic || typeof topic !== 'string' || topic.trim() === '') {
    errors.push('Topic is required');
  }

  const validDifficulties = ['beginner', 'intermediate', 'advanced', 'adaptive'];
  if (difficulty && !validDifficulties.includes(difficulty)) {
    errors.push(`Difficulty must be one of: ${validDifficulties.join(', ')}`);
  }

  const validStatuses = ['draft', 'published', 'archived'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  if (questions !== undefined) {
    if (!Array.isArray(questions)) {
      errors.push('Questions must be an array of question IDs');
    } else {
      const invalidIds = questions.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        errors.push('One or more question IDs have an invalid format');
      }
    }
  }

  if (status === 'published') {
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      errors.push('Cannot publish a quiz with no questions');
    }
  }

  if (timeLimit !== undefined) {
    const timeLimitNum = Number(timeLimit);
    if (isNaN(timeLimitNum) || timeLimitNum < 1) {
      errors.push('Time limit must be at least 1 minute');
    }
  }

  if (passingScore !== undefined) {
    const scoreNum = Number(passingScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      errors.push('Passing score must be a number between 0 and 100');
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

const validateUpdateQuiz = (req, res, next) => {
  const { title, topic, difficulty, questions, status, timeLimit, passingScore } = req.body;
  const errors = [];

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 3) {
      errors.push('Quiz title must be at least 3 characters long');
    } else if (title.trim().length > 200) {
      errors.push('Quiz title cannot exceed 200 characters');
    }
  }

  if (topic !== undefined && (typeof topic !== 'string' || topic.trim() === '')) {
    errors.push('Topic cannot be empty');
  }

  const validDifficulties = ['beginner', 'intermediate', 'advanced', 'adaptive'];
  if (difficulty && !validDifficulties.includes(difficulty)) {
    errors.push(`Difficulty must be one of: ${validDifficulties.join(', ')}`);
  }

  const validStatuses = ['draft', 'published', 'archived'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  if (questions !== undefined) {
    if (!Array.isArray(questions)) {
      errors.push('Questions must be an array of question IDs');
    } else {
      const invalidIds = questions.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        errors.push('One or more question IDs have an invalid format');
      }
    }
  }

  if (timeLimit !== undefined) {
    const timeLimitNum = Number(timeLimit);
    if (isNaN(timeLimitNum) || timeLimitNum < 1) {
      errors.push('Time limit must be at least 1 minute');
    }
  }

  if (passingScore !== undefined) {
    const scoreNum = Number(passingScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      errors.push('Passing score must be a number between 0 and 100');
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

const validateObjectId = (req, res, next) => {
  const id = req.params.id || req.params.quizId;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  next();
};

module.exports = {
  validateCreateQuiz,
  validateUpdateQuiz,
  validateObjectId
};
