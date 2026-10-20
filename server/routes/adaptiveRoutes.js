const express = require('express');
const {
  calculate,
  evaluate,
  getNextQuestion,
  getUserRating
} = require('../controllers/adaptiveController');
const {
  validateCalculateRating,
  validateEvaluate,
  validateNextQuestion
} = require('../validators/adaptiveValidator');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/calculate', protect, validateCalculateRating, calculate);
router.post('/evaluate', protect, validateEvaluate, evaluate);
router.post('/next-question', protect, validateNextQuestion, getNextQuestion);
router.get('/rating', protect, getUserRating);

module.exports = router;
