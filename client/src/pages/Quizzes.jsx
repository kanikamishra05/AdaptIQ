import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import quizService from '../services/quizService';

const Quizzes = () => {
  const { user } = useContext(AuthContext);
  const isTeacherOrInterviewer = user?.role === 'teacher' || user?.role === 'interviewer';

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [mineOnly, setMineOnly] = useState(false);

  const fetchQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (topic) params.topic = topic;
      if (statusFilter) params.status = statusFilter;
      if (mineOnly) params.mine = 'true';

      const data = await quizService.getQuizzes(params);
      setQuizzes(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [search, topic, statusFilter, mineOnly]);

  const handleDeleteQuiz = async (quizId, title) => {
    if (!window.confirm(`Are you sure you want to delete quiz "${title}"?`)) return;

    try {
      await quizService.deleteQuiz(quizId);
      setSuccessMsg(`Quiz "${title}" deleted successfully.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchQuizzes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete quiz');
    }
  };

  const handleTogglePublish = async (quiz) => {
    const nextStatus = quiz.status === 'published' ? 'draft' : 'published';
    try {
      await quizService.updateQuiz(quiz._id, { status: nextStatus });
      setSuccessMsg(`Quiz updated to ${nextStatus}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchQuizzes();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update quiz status`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">Published</span>;
      case 'draft':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Draft</span>;
      case 'archived':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">Archived</span>;
      default:
        return null;
    }
  };

  const getDifficultyBadge = (diff) => {
    const map = {
      beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
      advanced: 'bg-rose-50 text-rose-700 border-rose-200',
      adaptive: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium border capitalize ${map[diff] || 'bg-gray-50 text-gray-700'}`}>
        {diff}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isTeacherOrInterviewer ? 'Quiz Management' : 'Available Quizzes'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {isTeacherOrInterviewer
              ? 'Create, manage, and curate assessments for students and candidates.'
              : 'Explore and participate in published assessments.'}
          </p>
        </div>
        {isTeacherOrInterviewer && (
          <Link
            to="/quizzes/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition"
          >
            + Create New Quiz
          </Link>
        )}
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

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search by title or topic..."
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

          {isTeacherOrInterviewer && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          )}

          {isTeacherOrInterviewer && (
            <label className="flex items-center space-x-2 text-sm text-gray-700 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(e) => setMineOnly(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span>Only My Quizzes</span>
            </label>
          )}
        </div>
      </div>

      {/* Content State */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"></div>
          <p className="text-gray-500 text-sm">Loading quizzes...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="text-lg font-semibold text-gray-900">No quizzes found</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
            {isTeacherOrInterviewer
              ? 'Get started by creating your first quiz and linking questions from the question bank.'
              : 'There are currently no published quizzes matching your search criteria.'}
          </p>
          {isTeacherOrInterviewer && (
            <Link
              to="/quizzes/new"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition"
            >
              Create Quiz
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const isOwner = user && quiz.createdBy && (quiz.createdBy._id === user.id || quiz.createdBy === user.id);

            return (
              <div
                key={quiz._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {quiz.topic}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {getDifficultyBadge(quiz.difficulty)}
                      {isTeacherOrInterviewer && getStatusBadge(quiz.status)}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                    {quiz.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {quiz.description || 'No description provided.'}
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 text-center text-xs text-gray-600 mb-4">
                    <div>
                      <span className="block font-bold text-gray-900 text-sm">
                        {quiz.questions ? quiz.questions.length : 0}
                      </span>
                      Questions
                    </div>
                    <div>
                      <span className="block font-bold text-gray-900 text-sm">
                        {quiz.totalMarks || 0}
                      </span>
                      Marks
                    </div>
                    <div>
                      <span className="block font-bold text-gray-900 text-sm">
                        {quiz.timeLimit}m
                      </span>
                      Time
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Domain: {quiz.domain || 'General'}</span>
                    {quiz.createdBy?.name && (
                      <span>By: {quiz.createdBy.name}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Link
                      to={`/quizzes/${quiz._id}`}
                      className="flex-1 text-center py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold transition"
                    >
                      View Details
                    </Link>

                    {isOwner && (
                      <>
                        <Link
                          to={`/quizzes/${quiz._id}/edit`}
                          className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                          title="Edit Quiz"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleTogglePublish(quiz)}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg transition ${
                            quiz.status === 'published'
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                          title={quiz.status === 'published' ? 'Unpublish to Draft' : 'Publish Quiz'}
                        >
                          {quiz.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(quiz._id, quiz.title)}
                          className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition"
                          title="Delete Quiz"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Quizzes;
