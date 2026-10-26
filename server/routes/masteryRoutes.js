const express = require('express');
const {
  getMyMastery,
  getUserMastery,
  getCohortOverview,
  recordMastery
} = require('../controllers/masteryController');
const {
  validateRecordMastery,
  validateUserId
} = require('../validators/masteryValidator');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/me', protect, getMyMastery);
router.get('/cohort', protect, requireRole('teacher', 'interviewer'), getCohortOverview);
router.get('/user/:userId', protect, validateUserId, getUserMastery);
router.post('/record', protect, validateRecordMastery, recordMastery);

module.exports = router;
