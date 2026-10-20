/**
 * Core Adaptive Engine - Mathematical calculations and next question selection.
 * Based on AdaptIQ Project Contract Section 6.
 *
 * Formulas:
 *   Expected Score:  E = 1 / (1 + 10^((D - S) / 400))
 *   Rating Update:   S_new = S + K * (result - E)
 *
 * Where:
 *   S = Current skill rating (initial 1000)
 *   D = Question difficulty
 *   result = 1 for correct answer, 0 for incorrect answer
 *   K = Scaling factor (default 32)
 */

const DEFAULT_INITIAL_RATING = 1000;
const DEFAULT_K_FACTOR = 32;
const MIN_RATING = 100;
const MAX_RATING = 3000;

/**
 * Calculates the expected probability score E of a user with rating S
 * answering a question with difficulty D correctly.
 *
 * @param {number} userRating - Current skill rating S
 * @param {number} questionDifficulty - Question difficulty rating D
 * @returns {number} Expected score E between 0 and 1
 */
function calculateExpectedScore(userRating, questionDifficulty) {
  if (typeof userRating !== 'number' || isNaN(userRating) || !isFinite(userRating)) {
    throw new TypeError('userRating must be a valid finite number');
  }
  if (typeof questionDifficulty !== 'number' || isNaN(questionDifficulty) || !isFinite(questionDifficulty)) {
    throw new TypeError('questionDifficulty must be a valid finite number');
  }

  // Clamping exponent to [-10, 10] prevents numeric overflow/underflow in Math.pow(10, exponent)
  const exponent = (questionDifficulty - userRating) / 400;
  const clampedExponent = Math.max(-10, Math.min(10, exponent));

  const expected = 1 / (1 + Math.pow(10, clampedExponent));

  // Round to 4 decimal places for precision without floating point drift
  return Math.round(expected * 10000) / 10000;
}

/**
 * Calculates the updated skill rating S_new after attempting a question.
 * Supports secondary signals (response time and confidence metrics) as described in the contract.
 *
 * @param {number} userRating - Current skill rating S
 * @param {number} questionDifficulty - Question difficulty rating D
 * @param {number|boolean} result - 1 (or true) for correct, 0 (or false) for incorrect
 * @param {object} [options] - Optional secondary signals and parameters
 * @param {number} [options.kFactor] - Custom scaling factor K (default 32)
 * @param {number} [options.responseTime] - Time taken in seconds
 * @param {number} [options.expectedTime] - Standard time expected for question
 * @param {string} [options.confidence] - 'low' | 'medium' | 'high'
 * @returns {object} Detailed calculation result
 */
function calculateRatingChange(userRating, questionDifficulty, result, options = {}) {
  // Validate result: must be 1, 0, or boolean
  let numericResult;
  if (typeof result === 'boolean') {
    numericResult = result ? 1 : 0;
  } else if (result === 1 || result === 0) {
    numericResult = result;
  } else {
    throw new TypeError('result must be 1 (correct) or 0 (incorrect)');
  }

  const kFactor = typeof options.kFactor === 'number' && options.kFactor > 0
    ? options.kFactor
    : DEFAULT_K_FACTOR;

  const expectedScore = calculateExpectedScore(userRating, questionDifficulty);

  // Secondary signals influence (Section 6: e.g., answering correctly but very slowly yields smaller increase)
  let effectiveK = kFactor;
  if (numericResult === 1 && options.responseTime && options.expectedTime) {
    if (options.responseTime > options.expectedTime) {
      const overageRatio = (options.responseTime - options.expectedTime) / options.expectedTime;
      // Damping factor: minimum 0.75 of K
      const damping = Math.max(0.75, 1 - (overageRatio * 0.1));
      effectiveK = Math.round(kFactor * damping * 100) / 100;
    }
  }

  // Confidence metric secondary signal: low confidence on correct guess slightly damps gain
  if (numericResult === 1 && options.confidence === 'low') {
    effectiveK = Math.round(effectiveK * 0.85 * 100) / 100;
  }

  // Rating change formula: S_new = S + K * (result - expected)
  const ratingDeltaRaw = effectiveK * (numericResult - expectedScore);
  const ratingDelta = Math.round(ratingDeltaRaw * 100) / 100;

  // Compute new rating and clamp within contract bounds [100, 3000]
  let newRating = Math.round((userRating + ratingDelta) * 100) / 100;
  newRating = Math.max(MIN_RATING, Math.min(MAX_RATING, newRating));

  return {
    previousRating: userRating,
    questionDifficulty,
    result: numericResult,
    expectedScore,
    kFactor: effectiveK,
    ratingDelta,
    newRating
  };
}

/**
 * Deterministically selects the next question from an available pool
 * targeting a difficulty closest to the user's updated skill rating.
 *
 * @param {number} currentRating - User's current skill rating S
 * @param {Array<object>} questionsPool - Available question objects
 * @param {Array<string>} [answeredQuestionIds] - IDs of questions already attempted
 * @returns {object|null} The selected question or null if pool exhausted
 */
function selectNextQuestion(currentRating, questionsPool, answeredQuestionIds = []) {
  if (typeof currentRating !== 'number' || isNaN(currentRating) || !isFinite(currentRating)) {
    throw new TypeError('currentRating must be a valid number');
  }
  if (!Array.isArray(questionsPool)) {
    throw new TypeError('questionsPool must be an array');
  }

  const answeredSet = new Set((answeredQuestionIds || []).map(id => id.toString()));

  // Filter out questions that have already been answered
  const candidates = questionsPool.filter(q => {
    if (!q) return false;
    const qId = (q._id || q.id || '').toString();
    return !answeredSet.has(qId);
  });

  if (candidates.length === 0) {
    return null;
  }

  // Sort deterministically:
  // 1. Primary: absolute difficulty distance to current rating
  // 2. Secondary (tie-breaker): question ID string ascending
  candidates.sort((a, b) => {
    const diffA = Math.abs((a.difficulty !== undefined ? a.difficulty : DEFAULT_INITIAL_RATING) - currentRating);
    const diffB = Math.abs((b.difficulty !== undefined ? b.difficulty : DEFAULT_INITIAL_RATING) - currentRating);

    if (Math.abs(diffA - diffB) > 0.0001) {
      return diffA - diffB;
    }

    // Deterministic tie-breaker
    const idA = (a._id || a.id || '').toString();
    const idB = (b._id || b.id || '').toString();
    return idA.localeCompare(idB);
  });

  return candidates[0];
}

module.exports = {
  DEFAULT_INITIAL_RATING,
  DEFAULT_K_FACTOR,
  MIN_RATING,
  MAX_RATING,
  calculateExpectedScore,
  calculateRatingChange,
  selectNextQuestion
};
