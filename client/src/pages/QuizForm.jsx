import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import quizService from '../services/quizService';
import questionService from '../services/questionService';

const QuizForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: 'Computer Science',
    topic: '',
    difficulty: 'intermediate',
    timeLimit: 30,
    passingScore: 60,
    isAdaptive: false,
    status: 'draft',
    questions: []
  });

  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available questions from question bank
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await questionService.getQuestions();
        setAvailableQuestions(data.data || []);
      } catch (err) {
        console.error('Failed to fetch questions:', err);
      }
    };
    loadQuestions();
  }, []);

  // If edit mode, load existing quiz
  useEffect(() => {
    if (!isEdit) return;

    const loadQuiz = async () => {
      setLoading(true);
      try {
        const res = await quizService.getQuizById(id);
        const q = res.data;
        setFormData({
          title: q.title || '',
          description: q.description || '',
          domain: q.domain || 'Computer Science',
          topic: q.topic || '',
          difficulty: q.difficulty || 'intermediate',
          timeLimit: q.timeLimit || 30,
          passingScore: q.passingScore || 60,
          isAdaptive: Boolean(q.isAdaptive),
          status: q.status || 'draft',
          questions: q.questions ? q.questions.map(item => item._id || item) : []
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleToggleQuestion = (questionId) => {
    setFormData(prev => {
      const exists = prev.questions.includes(questionId);
      const updated = exists
        ? prev.questions.filter(qid => qid !== questionId)
        : [...prev.questions, questionId];
      return { ...prev, questions: updated };
    });
  };

  const calculateTotalMarks = () => {
    return formData.questions.reduce((sum, qId) => {
      const found = availableQuestions.find(q => q._id === qId);
      return sum + (found ? (found.marks || 1) : 1);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.status === 'published' && formData.questions.length === 0) {
      setError('Cannot publish a quiz with no questions. Please add at least 1 question or set status to Draft.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await quizService.updateQuiz(id, formData);
        navigate(`/quizzes/${id}`);
      } else {
        const created = await quizService.createQuiz(formData);
        navigate(`/quizzes/${created.data._id}`);
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.join(', '));
      } else {
        setError(err.response?.data?.message || 'Failed to save quiz');
      }
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"></div>
        <p className="text-gray-500 text-sm">Loading quiz editor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Quiz' : 'Create New Quiz'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure assessment properties and associate questions from your bank.
          </p>
        </div>
        <Link
          to={isEdit ? `/quizzes/${id}` : '/quizzes'}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold ml-2">&times;</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Quiz Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Data Structures & Algorithms Mastery"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength={3}
            maxLength={200}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Provide a brief summary or instructions for learners taking this assessment..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Domain & Topic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Domain
            </label>
            <input
              type="text"
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              placeholder="e.g. Computer Science"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Topic <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              placeholder="e.g. Binary Search Trees"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Difficulty, Time Limit, Passing Score */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="adaptive">Adaptive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Time Limit (mins)
            </label>
            <input
              type="number"
              name="timeLimit"
              value={formData.timeLimit}
              onChange={handleChange}
              min={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Passing Threshold (%)
            </label>
            <input
              type="number"
              name="passingScore"
              value={formData.passingScore}
              onChange={handleChange}
              min={0}
              max={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status & Adaptive Checkbox */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Publication Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft (Private)</option>
              <option value="published">Published (Visible to Students)</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center space-x-3 pt-6">
            <input
              type="checkbox"
              id="isAdaptive"
              name="isAdaptive"
              checked={formData.isAdaptive}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="isAdaptive" className="text-sm font-medium text-gray-700 cursor-pointer">
              Enable Adaptive Engine Configuration
            </label>
          </div>
        </div>

        {/* Question Selector from Question Bank */}
        <div className="pt-4 border-t border-gray-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-900">Associate Questions</h3>
              <p className="text-xs text-gray-500">
                Select items from your Question Bank to include in this quiz.
              </p>
            </div>
            <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
              {formData.questions.length} selected &bull; Total: {calculateTotalMarks()} marks
            </div>
          </div>

          {availableQuestions.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center text-sm text-gray-500">
              No questions found in Question Bank. You can{' '}
              <Link to="/questions/new" className="text-blue-600 underline font-medium" target="_blank">
                create questions here
              </Link>{' '}
              first or link them later!
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2">
              {availableQuestions.map((q) => {
                const isChecked = formData.questions.includes(q._id);
                return (
                  <label
                    key={q._id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition ${
                      isChecked ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleQuestion(q._id)}
                      className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1 text-sm">
                      <div className="font-semibold text-gray-900">{q.content}</div>
                      <div className="flex gap-2 text-xs text-gray-500 mt-1">
                        <span className="font-medium text-blue-600">{q.topic}</span>
                        <span>&bull;</span>
                        <span>Diff: {q.difficulty} ({q.difficultyLevel})</span>
                        <span>&bull;</span>
                        <span>{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Link
            to={isEdit ? `/quizzes/${id}` : '/quizzes'}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Quiz' : 'Create Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizForm;
