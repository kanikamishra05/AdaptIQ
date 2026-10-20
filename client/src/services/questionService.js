import api from './api';

export const questionService = {
  getQuestions: async (params = {}) => {
    const response = await api.get('/questions', { params });
    return response.data;
  },

  getQuestionById: async (id) => {
    const response = await api.get(`/questions/${id}`);
    return response.data;
  },

  createQuestion: async (questionData) => {
    const response = await api.post('/questions', questionData);
    return response.data;
  },

  updateQuestion: async (id, questionData) => {
    const response = await api.put(`/questions/${id}`, questionData);
    return response.data;
  },

  deleteQuestion: async (id) => {
    const response = await api.delete(`/questions/${id}`);
    return response.data;
  }
};

export default questionService;
