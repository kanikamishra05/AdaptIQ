const express = require('express');
const {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion
} = require('../controllers/questionController');
const {
  validateCreateQuestion,
  validateUpdateQuestion,
  validateObjectId
} = require('../validators/questionValidator');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, requireRole('teacher', 'interviewer'), validateCreateQuestion, createQuestion)
  .get(protect, requireRole('teacher', 'interviewer'), getQuestions);

router.route('/:id')
  .get(protect, validateObjectId, getQuestionById)
  .put(protect, requireRole('teacher', 'interviewer'), validateObjectId, validateUpdateQuestion, updateQuestion)
  .delete(protect, requireRole('teacher', 'interviewer'), validateObjectId, deleteQuestion);

module.exports = router;
