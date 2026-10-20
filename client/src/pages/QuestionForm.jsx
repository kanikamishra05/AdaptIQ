import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import questionService from '../services/questionService';

const QuestionForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    content: '',
    type: 'multiple_choice',
    domain: 'Computer Science',
    topic: '',
    difficulty: 1000,
    difficultyLevel: 'medium',
    marks: 1,
    explanation: '',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;

    const loadQuestion = async () => {
      setLoading(true);
      try {
        const res = await questionService.getQuestionById(id);
        const q = res.data;
        setFormData({
          content: q.content || '',
          type: q.type || 'multiple_choice',
          domain: q.domain || 'Computer Science',
          topic: q.topic || '',
          difficulty: q.difficulty || 1000,
          difficultyLevel: q.difficultyLevel || 'medium',
          marks: q.marks || 1,
          explanation: q.explanation || '',
          options: q.options && q.options.length >= 2 ? q.options.map(opt => ({
            text: opt.text || '',
            isCorrect: Boolean(opt.isCorrect)
          })) : [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false }
          ]
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load question');
      } finally {
        setLoading(false);
      }
    };

    loadQuestion();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'difficulty') {
      const num = Number(value);
      let level = 'medium';
      if (num < 800) level = 'easy';
      else if (num > 1200) level = 'hard';
      setFormData(prev => ({ ...prev, difficulty: num, difficultyLevel: level }));
    } else if (name === 'difficultyLevel') {
      let rating = formData.difficulty;
      if (value === 'easy' && rating >= 800) rating = 600;
      if (value === 'medium' && (rating < 800 || rating > 1200)) rating = 1000;
      if (value === 'hard' && rating <= 1200) rating = 1400;
      setFormData(prev => ({ ...prev, difficultyLevel: value, difficulty: rating }));
    } else if (name === 'type') {
      if (value === 'true_false') {
        setFormData(prev => ({
          ...prev,
          type: value,
          options: [
            { text: 'True', isCorrect: true },
            { text: 'False', isCorrect: false }
          ]
        }));
      } else {
        setFormData(prev => ({ ...prev, type: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleOptionTextChange = (index, text) => {
    setFormData(prev => {
      const updated = [...prev.options];
      updated[index] = { ...updated[index], text };
      return { ...prev, options: updated };
    });
  };

  const handleOptionCorrectChange = (index) => {
    setFormData(prev => {
      const isSingle = prev.type === 'single_choice' || prev.type === 'true_false';
      const updated = prev.options.map((opt, i) => {
        if (isSingle) {
          return { ...opt, isCorrect: i === index };
        } else {
          return i === index ? { ...opt, isCorrect: !opt.isCorrect } : opt;
        }
      });
      return { ...prev, options: updated };
    });
  };

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { text: '', isCorrect: false }]
    }));
  };

  const handleRemoveOption = (index) => {
    if (formData.options.length <= 2) {
      alert('A question must have at least 2 options.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.content.trim()) {
      setError('Question content is required');
      return;
    }

    if (!formData.topic.trim()) {
      setError('Topic is required');
      return;
    }

    const emptyOpt = formData.options.some(opt => !opt.text.trim());
    if (emptyOpt) {
      setError('All options must have non-empty text.');
      return;
    }

    const hasCorrect = formData.options.some(opt => opt.isCorrect);
    if (!hasCorrect) {
      setError('Please designate at least one option as the correct answer.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await questionService.updateQuestion(id, formData);
      } else {
        await questionService.createQuestion(formData);
      }
      navigate('/questions');
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.join(', '));
      } else {
        setError(err.response?.data?.message || 'Failed to save question');
      }
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"></div>
        <p className="text-gray-500 text-sm">Loading question editor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Question' : 'Add New Question'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Author questions with difficulty parameters, answer keys, and learning explanations.
          </p>
        </div>
        <Link to="/questions" className="text-sm font-medium text-gray-600 hover:text-gray-900">
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
        {/* Question Text */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Question Content <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={3}
            placeholder="Type your question statement or problem here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Type & Marks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Question Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="multiple_choice">Multiple Choice (Multiple Correct)</option>
              <option value="single_choice">Single Choice (One Correct)</option>
              <option value="true_false">True / False</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Marks / Score Points
            </label>
            <input
              type="number"
              name="marks"
              value={formData.marks}
              onChange={handleChange}
              min={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
              placeholder="e.g. Data Structures"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Difficulty Calibration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Difficulty Elo Rating (100–3000)
            </label>
            <input
              type="number"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              min={100}
              max={3000}
              step={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Used by future adaptive algorithm (Initial default: 1000)</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Difficulty Tier
            </label>
            <select
              name="difficultyLevel"
              value={formData.difficultyLevel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="easy">Easy (&lt; 800)</option>
              <option value="medium">Medium (800 - 1200)</option>
              <option value="hard">Hard (&gt; 1200)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Category level representation</p>
          </div>
        </div>

        {/* Options Builder */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-700">
              Answer Options & Correct Answer Designation <span className="text-red-500">*</span>
            </label>
            {formData.type !== 'true_false' && (
              <button
                type="button"
                onClick={handleAddOption}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                + Add Option
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Check the green indicator next to each option that represents a correct answer.
          </p>

          <div className="space-y-3">
            {formData.options.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleOptionCorrectChange(idx)}
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    option.isCorrect
                      ? 'bg-green-600 text-white shadow-sm ring-2 ring-green-300'
                      : 'bg-gray-100 text-gray-400 border border-gray-300 hover:bg-gray-200'
                  }`}
                  title={option.isCorrect ? 'Correct option' : 'Click to mark as correct'}
                >
                  ✓
                </button>

                <div className="flex-1 flex items-center space-x-2">
                  <span className="text-xs font-bold text-gray-400 w-4">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                    disabled={formData.type === 'true_false'}
                    placeholder={`Option ${String.fromCharCode(65 + idx)} text...`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required
                  />
                </div>

                {formData.type !== 'true_false' && formData.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="text-gray-400 hover:text-red-600 p-1 rounded"
                    title="Remove option"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Learning Explanation / Solution Rationale
          </label>
          <textarea
            name="explanation"
            value={formData.explanation}
            onChange={handleChange}
            rows={2}
            placeholder="Explain why the correct answer is right to aid student comprehension in future evaluation..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit / Cancel */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Link
            to="/questions"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Question' : 'Save Question'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;
