const Mastery = require('../models/Mastery');
const User = require('../models/User');

/**
 * Records an assessment attempt against a topic and recalculates mastery
 */
const recordAttempt = async ({ userId, topic, domain = 'General', isCorrect, userRating }) => {
  const normalizedTopic = topic.trim();
  let rating = userRating;

  if (rating === undefined) {
    const user = await User.findById(userId);
    rating = user?.skillRating || 1000;
  }

  let mastery = await Mastery.findOne({ user: userId, topic: normalizedTopic });

  if (!mastery) {
    mastery = new Mastery({
      user: userId,
      topic: normalizedTopic,
      domain: domain || 'General',
      questionsAttempted: 0,
      questionsCorrect: 0
    });
  }

  mastery.questionsAttempted += 1;
  if (isCorrect) {
    mastery.questionsCorrect += 1;
  }
  if (domain && domain !== 'General') {
    mastery.domain = domain;
  }

  mastery.updateMasteryMetrics(rating);
  await mastery.save();

  return mastery;
};

/**
 * Retrieves a user's topic-level mastery profile and aggregate summary
 */
const getUserMasteryProfile = async (userId, filters = {}) => {
  const query = { user: userId };

  if (filters.domain) {
    query.domain = { $regex: filters.domain, $options: 'i' };
  }

  if (filters.search) {
    query.$or = [
      { topic: { $regex: filters.search, $options: 'i' } },
      { domain: { $regex: filters.search, $options: 'i' } }
    ];
  }

  let sortOption = { masteryScore: -1 };
  if (filters.sortBy === 'topic') sortOption = { topic: 1 };
  if (filters.sortBy === 'recent') sortOption = { lastAttemptedAt: -1 };
  if (filters.sortBy === 'lowest') sortOption = { masteryScore: 1 };

  const records = await Mastery.find(query).sort(sortOption);

  // Compute summary stats
  const totalTopics = records.length;
  let totalAttempted = 0;
  let totalCorrect = 0;
  let masterySum = 0;

  for (const r of records) {
    totalAttempted += r.questionsAttempted;
    totalCorrect += r.questionsCorrect;
    masterySum += r.masteryScore;
  }

  const averageMastery = totalTopics > 0 ? Math.round((masterySum / totalTopics) * 100) / 100 : 0;
  const overallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 10000) / 100 : 0;

  const sortedByScore = [...records].sort((a, b) => b.masteryScore - a.masteryScore);
  const strongestTopic = sortedByScore.length > 0 ? sortedByScore[0] : null;
  const weakestTopic = sortedByScore.length > 1 ? sortedByScore[sortedByScore.length - 1] : null;

  return {
    summary: {
      totalTopics,
      averageMastery,
      totalAttempted,
      totalCorrect,
      overallAccuracy,
      strongestTopic: strongestTopic ? { topic: strongestTopic.topic, masteryScore: strongestTopic.masteryScore } : null,
      weakestTopic: weakestTopic ? { topic: weakestTopic.topic, masteryScore: weakestTopic.masteryScore } : null
    },
    topics: records
  };
};

/**
 * Aggregates cohort-wide topic mastery for teachers/interviewers
 */
const getCohortMasteryOverview = async (filters = {}) => {
  const matchStage = {};
  if (filters.domain) {
    matchStage.domain = { $regex: filters.domain, $options: 'i' };
  }
  if (filters.search) {
    matchStage.topic = { $regex: filters.search, $options: 'i' };
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$topic',
        topic: { $first: '$topic' },
        domain: { $first: '$domain' },
        studentCount: { $sum: 1 },
        totalAttempted: { $sum: '$questionsAttempted' },
        totalCorrect: { $sum: '$questionsCorrect' },
        averageMastery: { $avg: '$masteryScore' },
        averageAccuracy: { $avg: '$accuracy' }
      }
    },
    {
      $project: {
        _id: 0,
        topic: 1,
        domain: 1,
        studentCount: 1,
        totalAttempted: 1,
        totalCorrect: 1,
        averageMastery: { $round: ['$averageMastery', 2] },
        averageAccuracy: { $round: ['$averageAccuracy', 2] }
      }
    },
    { $sort: { averageMastery: 1 } } // Weakest topics first by default to spotlight remedial areas
  ];

  const topicSummaries = await Mastery.aggregate(pipeline);

  const weakAreas = topicSummaries.filter(t => t.averageMastery < 60);
  const strongAreas = topicSummaries.filter(t => t.averageMastery >= 75);

  return {
    totalTopicsTracked: topicSummaries.length,
    weakAreasCount: weakAreas.length,
    strongAreasCount: strongAreas.length,
    weakAreas,
    strongAreas,
    topics: topicSummaries
  };
};

module.exports = {
  recordAttempt,
  getUserMasteryProfile,
  getCohortMasteryOverview
};
