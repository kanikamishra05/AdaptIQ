const User = require('../models/User');
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const RatingLog = require('../models/RatingLog');
const {
  DEFAULT_INITIAL_RATING,
  DEFAULT_K_FACTOR,
  calculateExpectedScore,
  calculateRatingChange,
  selectNextQuestion
} = require('../utils/adaptiveMath');

/**
 * Pure calculation preview
 */
const calculateRating = (userRating, questionDifficulty, result, options = {}) => {
  return calculateRatingChange(userRating, questionDifficulty, result, options);
};

/**
 * Evaluates a submitted question answer adaptively:
 * - Reads trusted question difficulty and correctness from DB
 * - Computes Elo expected score and rating delta
 * - Updates user skill rating
 * - Records idempotent RatingLog
 * - Deterministically selects the next question if quizId provided
 */
const evaluateAnswer = async ({
  userId,
  questionId,
  selectedOptionId,
  quizId,
  answeredQuestionIds = [],
  idempotencyKey,
  responseTime,
  expectedTime,
  confidence
}) => {
  // Idempotency check: if key already processed, return stored evaluation without reapplying
  if (idempotencyKey) {
    const existingLog = await RatingLog.findOne({ user: userId, idempotencyKey })
      .populate('question', 'content explanation');

    if (existingLog) {
      let nextQuestion = null;
      if (quizId) {
        const quiz = await Quiz.findById(quizId).populate('questions');
        if (quiz) {
          const allAnswered = [...answeredQuestionIds, questionId.toString()];
          const rawNext = selectNextQuestion(existingLog.newRating, quiz.questions, allAnswered);
          if (rawNext) {
            nextQuestion = rawNext.toStudentSafeObject ? rawNext.toStudentSafeObject() : rawNext;
          }
        }
      }

      return {
        isIdempotentReplay: true,
        isCorrect: existingLog.isCorrect,
        selectedOptionId,
        previousRating: existingLog.previousRating,
        questionDifficulty: existingLog.questionDifficulty,
        expectedScore: existingLog.expectedScore,
        ratingDelta: existingLog.ratingDelta,
        newRating: existingLog.newRating,
        kFactor: existingLog.kFactor,
        explanation: existingLog.question?.explanation || '',
        nextQuestion
      };
    }
  }

  // Fetch trusted question from database
  const question = await Question.findById(questionId);
  if (!question) {
    const error = new Error('Question not found');
    error.statusCode = 404;
    throw error;
  }

  // Fetch user
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Validate selected option exists in question options
  const option = question.options.find(
    opt => opt._id.toString() === selectedOptionId.toString()
  );

  if (!option) {
    const error = new Error('Invalid selectedOptionId: option does not exist for this question');
    error.statusCode = 400;
    throw error;
  }

  // Evaluate correctness against trusted database record
  const isCorrect = option.isCorrect === true;
  const result = isCorrect ? 1 : 0;
  const currentRating = typeof user.skillRating === 'number' ? user.skillRating : DEFAULT_INITIAL_RATING;

  // Calculate rating change using pure mathematical formula
  const ratingResult = calculateRatingChange(
    currentRating,
    question.difficulty,
    result,
    {
      kFactor: DEFAULT_K_FACTOR,
      responseTime,
      expectedTime,
      confidence
    }
  );

  // Update user's authoritative skill rating in database
  user.skillRating = ratingResult.newRating;
  await user.save();

  // Save audit log and idempotency record
  await RatingLog.create({
    user: user._id,
    question: question._id,
    quiz: quizId || null,
    idempotencyKey: idempotencyKey || null,
    previousRating: ratingResult.previousRating,
    newRating: ratingResult.newRating,
    ratingDelta: ratingResult.ratingDelta,
    expectedScore: ratingResult.expectedScore,
    questionDifficulty: ratingResult.questionDifficulty,
    result: ratingResult.result,
    isCorrect,
    kFactor: ratingResult.kFactor,
    responseTime: responseTime || null,
    confidence: confidence || null
  });

  // Next question selection from quiz pool if quizId is provided
  let nextQuestion = null;
  if (quizId) {
    const quiz = await Quiz.findById(quizId).populate('questions');
    if (quiz && Array.isArray(quiz.questions)) {
      const allAnswered = [...answeredQuestionIds, questionId.toString()];
      const rawNext = selectNextQuestion(ratingResult.newRating, quiz.questions, allAnswered);
      if (rawNext) {
        // Sanitize for student: hide answer key and explanation of future question
        nextQuestion = rawNext.toStudentSafeObject ? rawNext.toStudentSafeObject() : rawNext;
      }
    }
  }

  return {
    isCorrect,
    selectedOptionId,
    previousRating: ratingResult.previousRating,
    questionDifficulty: ratingResult.questionDifficulty,
    expectedScore: ratingResult.expectedScore,
    ratingDelta: ratingResult.ratingDelta,
    newRating: ratingResult.newRating,
    kFactor: ratingResult.kFactor,
    explanation: question.explanation || '',
    nextQuestion
  };
};

/**
 * Deterministically select next question for a user in a quiz
 */
const getNextQuestion = async ({ quizId, answeredQuestionIds = [], targetRating, userId }) => {
  const quiz = await Quiz.findById(quizId).populate('questions');
  if (!quiz) {
    const error = new Error('Quiz not found');
    error.statusCode = 404;
    throw error;
  }

  let rating = targetRating;
  if (rating === undefined && userId) {
    const user = await User.findById(userId);
    rating = user ? user.skillRating : DEFAULT_INITIAL_RATING;
  }
  if (rating === undefined) {
    rating = DEFAULT_INITIAL_RATING;
  }

  const rawNext = selectNextQuestion(rating, quiz.questions, answeredQuestionIds);
  if (!rawNext) {
    return null;
  }

  // Sanitize next question so answer keys are not leaked
  return rawNext.toStudentSafeObject ? rawNext.toStudentSafeObject() : rawNext;
};

module.exports = {
  calculateRating,
  evaluateAnswer,
  getNextQuestion
};
