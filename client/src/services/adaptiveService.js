import api from './api';

export const adaptiveService = {
  /**
   * Fetches the authoritative skill rating for the current authenticated user.
   */
  getUserRating: async () => {
    const response = await api.get('/adaptive/rating');
    return response.data;
  },

  /**
   * Calls the backend adaptive engine to compute expected score and rating delta.
   * Calculations are strictly authoritative and server-side.
   */
  calculateRating: async ({ userRating, questionDifficulty, result, kFactor, responseTime, expectedTime, confidence }) => {
    const response = await api.post('/adaptive/calculate', {
      userRating,
      questionDifficulty,
      result,
      kFactor,
      responseTime,
      expectedTime,
      confidence
    });
    return response.data;
  },

  /**
   * Evaluates an answered question adaptively against trusted database records.
   */
  evaluateAnswer: async ({ questionId, selectedOptionId, quizId, answeredQuestionIds, idempotencyKey, responseTime, confidence }) => {
    const response = await api.post('/adaptive/evaluate', {
      questionId,
      selectedOptionId,
      quizId,
      answeredQuestionIds,
      idempotencyKey,
      responseTime,
      confidence
    });
    return response.data;
  },

  /**
   * Requests the next deterministic question from a quiz based on rating.
   */
  getNextQuestion: async ({ quizId, answeredQuestionIds, targetRating }) => {
    const response = await api.post('/adaptive/next-question', {
      quizId,
      answeredQuestionIds,
      targetRating
    });
    return response.data;
  }
};

export default adaptiveService;
