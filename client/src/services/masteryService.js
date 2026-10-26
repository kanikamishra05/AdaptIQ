import api from './api';

export const masteryService = {
  /**
   * Fetches current authenticated user's topic mastery profile
   */
  getMyMastery: async (params = {}) => {
    const response = await api.get('/mastery/me', { params });
    return response.data;
  },

  /**
   * Fetches specific student's mastery profile (for teachers/interviewers or self)
   */
  getUserMastery: async (userId, params = {}) => {
    const response = await api.get(`/mastery/user/${userId}`, { params });
    return response.data;
  },

  /**
   * Fetches cohort-wide topic mastery analytics (for teachers/interviewers)
   */
  getCohortOverview: async (params = {}) => {
    const response = await api.get('/mastery/cohort', { params });
    return response.data;
  },

  /**
   * Records or updates a topic mastery attempt
   */
  recordMastery: async (data) => {
    const response = await api.post('/mastery/record', data);
    return response.data;
  }
};

export default masteryService;
