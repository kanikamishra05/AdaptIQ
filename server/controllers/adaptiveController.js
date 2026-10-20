const adaptiveService = require('../services/adaptiveService');
const User = require('../models/User');

// POST /api/v1/adaptive/calculate
const calculate = (req, res, next) => {
  try {
    const { userRating, questionDifficulty, result, kFactor, responseTime, expectedTime, confidence } = req.body;

    const data = adaptiveService.calculateRating(
      Number(userRating),
      Number(questionDifficulty),
      result,
      {
        kFactor: kFactor ? Number(kFactor) : undefined,
        responseTime: responseTime ? Number(responseTime) : undefined,
        expectedTime: expectedTime ? Number(expectedTime) : undefined,
        confidence
      }
    );

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/adaptive/evaluate
const evaluate = async (req, res, next) => {
  try {
    const {
      questionId,
      selectedOptionId,
      quizId,
      answeredQuestionIds,
      idempotencyKey,
      responseTime,
      expectedTime,
      confidence
    } = req.body;

    const data = await adaptiveService.evaluateAnswer({
      userId: req.user.userId,
      questionId,
      selectedOptionId,
      quizId,
      answeredQuestionIds,
      idempotencyKey,
      responseTime,
      expectedTime,
      confidence
    });

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// POST /api/v1/adaptive/next-question
const getNextQuestion = async (req, res, next) => {
  try {
    const { quizId, answeredQuestionIds, targetRating } = req.body;

    const data = await adaptiveService.getNextQuestion({
      quizId,
      answeredQuestionIds,
      targetRating: targetRating !== undefined ? Number(targetRating) : undefined,
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// GET /api/v1/adaptive/rating
const getUserRating = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        name: user.name,
        role: user.role,
        skillRating: user.skillRating || 1000,
        initialRating: 1000
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculate,
  evaluate,
  getNextQuestion,
  getUserRating
};
