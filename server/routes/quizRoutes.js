const express = require('express');
const {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  addQuestionsToQuiz,
  removeQuestionFromQuiz
} = require('../controllers/quizController');
const {
  validateCreateQuiz,
  validateUpdateQuiz,
  validateObjectId
} = require('../validators/quizValidator');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, requireRole('teacher', 'interviewer'), validateCreateQuiz, createQuiz)
  .get(protect, getQuizzes);

router.route('/:id')
  .get(protect, validateObjectId, getQuizById)
  .put(protect, requireRole('teacher', 'interviewer'), validateObjectId, validateUpdateQuiz, updateQuiz)
  .delete(protect, requireRole('teacher', 'interviewer'), validateObjectId, deleteQuiz);

router.route('/:id/questions')
  .post(protect, requireRole('teacher', 'interviewer'), validateObjectId, addQuestionsToQuiz);

router.route('/:id/questions/:questionId')
  .delete(protect, requireRole('teacher', 'interviewer'), removeQuestionFromQuiz);

module.exports = router;
