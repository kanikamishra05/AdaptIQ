const mongoose = require('mongoose');

const validateCreateQuestion = (req, res, next) => {
  const { content, type, options, topic, difficulty, marks } = req.body;
  const errors = [];

  if (!content || typeof content !== 'string' || content.trim() === '') {
    errors.push('Question content is required');
  }

  if (!topic || typeof topic !== 'string' || topic.trim() === '') {
    errors.push('Topic is required');
  }

  const validTypes = ['multiple_choice', 'single_choice', 'true_false'];
  const questionType = type || 'multiple_choice';
  if (!validTypes.includes(questionType)) {
    errors.push(`Question type must be one of: ${validTypes.join(', ')}`);
  }

  if (!Array.isArray(options) || options.length < 2) {
    errors.push('Options must be an array containing at least 2 options');
  } else {
    let hasCorrect = false;
    let correctCount = 0;
    const texts = new Set();

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      if (!opt || typeof opt.text !== 'string' || opt.text.trim() === '') {
        errors.push(`Option ${i + 1} must have non-empty text`);
        continue;
      }

      const lower = opt.text.trim().toLowerCase();
      if (texts.has(lower)) {
        errors.push(`Duplicate option text detected: "${opt.text}"`);
      }
      texts.add(lower);

      if (opt.isCorrect === true) {
        hasCorrect = true;
        correctCount++;
      }
    }

    if (!hasCorrect) {
      errors.push('At least one option must be marked as correct');
    }

    if ((questionType === 'single_choice' || questionType === 'true_false') && correctCount > 1) {
      errors.push(`${questionType} questions must have exactly one correct option`);
    }

    if (questionType === 'true_false' && options.length !== 2) {
      errors.push('True/False questions must have exactly 2 options');
    }
  }

  if (difficulty !== undefined) {
    const diffNum = Number(difficulty);
    if (isNaN(diffNum) || diffNum < 100 || diffNum > 3000) {
      errors.push('Difficulty must be a number between 100 and 3000');
    }
  }

  if (marks !== undefined) {
    const marksNum = Number(marks);
    if (isNaN(marksNum) || marksNum < 1) {
      errors.push('Marks must be a number greater than or equal to 1');
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

const validateUpdateQuestion = (req, res, next) => {
  const { content, type, options, topic, difficulty, marks } = req.body;
  const errors = [];

  if (content !== undefined && (typeof content !== 'string' || content.trim() === '')) {
    errors.push('Question content cannot be empty');
  }

  if (topic !== undefined && (typeof topic !== 'string' || topic.trim() === '')) {
    errors.push('Topic cannot be empty');
  }

  const validTypes = ['multiple_choice', 'single_choice', 'true_false'];
  if (type !== undefined && !validTypes.includes(type)) {
    errors.push(`Question type must be one of: ${validTypes.join(', ')}`);
  }

  if (options !== undefined) {
    if (!Array.isArray(options) || options.length < 2) {
      errors.push('Options must be an array containing at least 2 options');
    } else {
      let hasCorrect = false;
      let correctCount = 0;
      const texts = new Set();

      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        if (!opt || typeof opt.text !== 'string' || opt.text.trim() === '') {
          errors.push(`Option ${i + 1} must have non-empty text`);
          continue;
        }

        const lower = opt.text.trim().toLowerCase();
        if (texts.has(lower)) {
          errors.push(`Duplicate option text detected: "${opt.text}"`);
        }
        texts.add(lower);

        if (opt.isCorrect === true) {
          hasCorrect = true;
          correctCount++;
        }
      }

      if (!hasCorrect) {
        errors.push('At least one option must be marked as correct');
      }

      const effectiveType = type || 'multiple_choice';
      if ((effectiveType === 'single_choice' || effectiveType === 'true_false') && correctCount > 1) {
        errors.push(`${effectiveType} questions must have exactly one correct option`);
      }

      if (effectiveType === 'true_false' && options.length !== 2) {
        errors.push('True/False questions must have exactly 2 options');
      }
    }
  }

  if (difficulty !== undefined) {
    const diffNum = Number(difficulty);
    if (isNaN(diffNum) || diffNum < 100 || diffNum > 3000) {
      errors.push('Difficulty must be a number between 100 and 3000');
    }
  }

  if (marks !== undefined) {
    const marksNum = Number(marks);
    if (isNaN(marksNum) || marksNum < 1) {
      errors.push('Marks must be a number greater than or equal to 1');
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
  const id = req.params.id || req.params.questionId;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  next();
};

module.exports = {
  validateCreateQuestion,
  validateUpdateQuestion,
  validateObjectId
};
