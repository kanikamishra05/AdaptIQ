import api from './api';

export const quizService = {
  getQuizzes: async (params = {}) => {
    const response = await api.get('/quizzes', { params });
    return response.data;
  },

  getQuizById: async (id) => {
    const response = await api.get(`/quizzes/${id}`);
    return response.data;
  },

  createQuiz: async (quizData) => {
    const response = await api.post('/quizzes', quizData);
    return response.data;
  },

  updateQuiz: async (id, quizData) => {
    const response = await api.put(`/quizzes/${id}`, quizData);
    return response.data;
  },

  deleteQuiz: async (id) => {
    const response = await api.delete(`/quizzes/${id}`);
    return response.data;
  },

  addQuestionsToQuiz: async (quizId, questionIds) => {
    const response = await api.post(`/quizzes/${quizId}/questions`, { questionIds });
    return response.data;
  },

  removeQuestionFromQuiz: async (quizId, questionId) => {
    const response = await api.delete(`/quizzes/${quizId}/questions/${questionId}`);
    return response.data;
  }
};

export default quizService;
