import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import questionService from '../services/questionService';

const Questions = () => {
  const { user } = useContext(AuthContext);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('');
  const [mineOnly, setMineOnly] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (topic) params.topic = topic;
      if (difficultyLevel) params.difficultyLevel = difficultyLevel;
      if (mineOnly) params.mine = 'true';

      const data = await questionService.getQuestions(params);
      setQuestions(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [search, topic, difficultyLevel, mineOnly]);

  const handleDelete = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question? It will be removed from all quizzes.')) return;

    try {
      await questionService.deleteQuestion(questionId);
      setSuccessMsg('Question deleted successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete question');
    }
  };

  const getDifficultyBadge = (level) => {
    const map = {
      easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      medium: 'bg-amber-50 text-amber-700 border-amber-200',
      hard: 'bg-rose-50 text-rose-700 border-rose-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold border capitalize ${map[level] || 'bg-gray-50 text-gray-700'}`}>
        {level}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Question Bank</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create, calibrate, and organize reusable test items with difficulty ratings and scoring metadata.
          </p>
        </div>
        <Link
          to="/questions/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition"
        >
          + Add New Question
        </Link>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold ml-2">&times;</button>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold ml-2">&times;</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search questions or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Filter by topic (e.g. Algorithms)..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={difficultyLevel}
            onChange={(e) => setDifficultyLevel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Difficulty Levels</option>
            <option value="easy">Easy (&lt; 800)</option>
            <option value="medium">Medium (800 - 1200)</option>
            <option value="hard">Hard (&gt; 1200)</option>
          </select>
          <label className="flex items-center space-x-2 text-sm text-gray-700 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => setMineOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span>Only My Questions</span>
          </label>
        </div>
      </div>

      {/* List / Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"></div>
          <p className="text-gray-500 text-sm">Loading questions...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-4xl mb-3">📚</div>
          <h3 className="text-lg font-semibold text-gray-900">No questions found</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
            Build your repository by authoring your first question with options, difficulty calibration, and explanations.
          </p>
          <Link
            to="/questions/new"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition"
          >
            Create Question
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isOwner = user && q.createdBy && (q.createdBy._id === user.id || q.createdBy === user.id);

            return (
              <div
                key={q._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {q.topic}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">
                      {q.type?.replace('_', ' ')}
                    </span>
                    {getDifficultyBadge(q.difficultyLevel)}
                    <span className="text-xs font-medium text-gray-500">
                      Elo Rating: <strong className="text-gray-800">{q.difficulty}</strong>
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                    </span>
                  </div>

                  {isOwner && (
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/questions/${q._id}/edit`}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium transition"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(q._id)}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-xs font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-gray-900 font-semibold text-base">
                  {q.content}
                </div>

                {/* Options display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options?.map((opt, optIdx) => (
                    <div
                      key={opt._id || optIdx}
                      className={`p-2.5 rounded-lg border text-sm flex items-center justify-between ${
                        opt.isCorrect
                          ? 'bg-green-50 border-green-300 text-green-900 font-semibold'
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full border border-gray-300 text-xs flex items-center justify-center font-bold text-gray-500">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      {opt.isCorrect && (
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {q.explanation && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900">
                    <span className="font-bold">Explanation: </span>
                    {q.explanation}
                  </div>
                )}

                <div className="text-xs text-gray-400 flex justify-between items-center pt-2 border-t border-gray-100">
                  <span>Domain: {q.domain || 'General'}</span>
                  <span>Created by: {q.createdBy?.name || 'Instructor'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Questions;
