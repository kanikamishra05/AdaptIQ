const masteryService = require('../services/masteryService');
const User = require('../models/User');

// GET /api/v1/mastery/me
const getMyMastery = async (req, res, next) => {
  try {
    const profile = await masteryService.getUserMasteryProfile(req.user.userId, req.query);

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/mastery/user/:userId
const getUserMastery = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;

    // Permissions: Only teachers/interviewers or the student themselves can view the profile
    const isSelf = req.user.userId.toString() === targetUserId.toString();
    const isAuthorizedStaff = req.user.role === 'teacher' || req.user.role === 'interviewer';

    if (!isSelf && !isAuthorizedStaff) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions to view another student mastery profile'
      });
    }

    const targetUser = await User.findById(targetUserId).select('name email role skillRating');
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profile = await masteryService.getUserMasteryProfile(targetUserId, req.query);

    res.status(200).json({
      success: true,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        skillRating: targetUser.skillRating || 1000
      },
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/mastery/cohort
const getCohortOverview = async (req, res, next) => {
  try {
    const overview = await masteryService.getCohortMasteryOverview(req.query);

    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/mastery/record
const recordMastery = async (req, res, next) => {
  try {
    const { topic, domain, isCorrect, userRating } = req.body;

    const mastery = await masteryService.recordAttempt({
      userId: req.user.userId,
      topic,
      domain,
      isCorrect: Boolean(isCorrect),
      userRating
    });

    res.status(200).json({
      success: true,
      data: mastery
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyMastery,
  getUserMastery,
  getCohortOverview,
  recordMastery
};
