import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import quizService from '../services/quizService';
import questionService from '../services/questionService';

const QuizDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal / Inline question adding
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const isTeacherOrInterviewer = user?.role === 'teacher' || user?.role === 'interviewer';

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await quizService.getQuizById(id);
      setQuiz(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quiz details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const isOwner = user && quiz?.createdBy && (quiz.createdBy._id === user.id || quiz.createdBy === user.id);

  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    setLoadingQuestions(true);
    try {
      const data = await questionService.getQuestions();
      const existingIds = new Set((quiz.questions || []).map(q => q._id));
      const notInQuiz = (data.data || []).filter(q => !existingIds.has(q._id));
      setAvailableQuestions(notInQuiz);
      setSelectedToAdd([]);
    } catch (err) {
      setError('Failed to fetch question bank');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAddQuestionsSubmit = async (e) => {
    e.preventDefault();
    if (selectedToAdd.length === 0) return;

    try {
      await quizService.addQuestionsToQuiz(quiz._id, selectedToAdd);
      setSuccessMsg(`Added ${selectedToAdd.length} question(s) to quiz.`);
      setShowAddModal(false);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchQuiz();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add questions');
    }
  };

  const handleRemoveQuestion = async (questionId, questionText) => {
    if (!window.confirm('Remove this question from the quiz?')) return;

    try {
      await quizService.removeQuestionFromQuiz(quiz._id, questionId);
      setSuccessMsg('Question removed from quiz.');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchQuiz();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove question');
    }
  };

  const handleDeleteQuiz = async () => {
    if (!window.confirm(`Are you sure you want to delete quiz "${quiz.title}"?`)) return;

    try {
      await quizService.deleteQuiz(quiz._id);
      navigate('/quizzes');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete quiz');
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = quiz.status === 'published' ? 'draft' : 'published';
    try {
      await quizService.updateQuiz(quiz._id, { status: nextStatus });
      setSuccessMsg(`Quiz status changed to ${nextStatus}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchQuiz();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quiz status');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"></div>
        <p className="text-gray-500 text-sm">Loading quiz details...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center max-w-lg mx-auto">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Quiz Unavailable</h2>
        <p className="text-gray-600 text-sm mb-6">{error || 'Quiz could not be found or you do not have permission.'}</p>
        <Link to="/quizzes" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
          Back to Quizzes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/quizzes" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
          &larr; Back to all quizzes
        </Link>
        {isOwner && (
          <div className="flex items-center space-x-2">
            <Link
              to={`/quizzes/${quiz._id}/edit`}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
            >
              Edit Quiz
            </Link>
            <button
              onClick={handleToggleStatus}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition ${
                quiz.status === 'published'
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
            >
              {quiz.status === 'published' ? 'Unpublish' : 'Publish Quiz'}
            </button>
            <button
              onClick={handleDeleteQuiz}
              className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 text-sm font-medium rounded-lg transition"
            >
              Delete Quiz
            </button>
          </div>
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

      {/* Quiz Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-blue-100 text-blue-800">
            {quiz.topic}
          </span>
          <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
            {quiz.difficulty}
          </span>
          {isTeacherOrInterviewer && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
              quiz.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {quiz.status}
            </span>
          )}
          {quiz.isAdaptive && (
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
              ⚡ Adaptive Engine Enabled
            </span>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{quiz.title}</h1>
          <p className="mt-2 text-gray-600 text-sm sm:text-base">{quiz.description || 'No description provided.'}</p>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100 text-sm">
          <div>
            <span className="text-gray-500 text-xs block uppercase">Questions</span>
            <span className="font-bold text-gray-900">{quiz.questions ? quiz.questions.length : 0} items</span>
          </div>
          <div>
            <span className="text-gray-500 text-xs block uppercase">Total Marks</span>
            <span className="font-bold text-gray-900">{quiz.totalMarks || 0} pts</span>
          </div>
          <div>
            <span className="text-gray-500 text-xs block uppercase">Time Limit</span>
            <span className="font-bold text-gray-900">{quiz.timeLimit} minutes</span>
          </div>
          <div>
            <span className="text-gray-500 text-xs block uppercase">Passing Threshold</span>
            <span className="font-bold text-gray-900">{quiz.passingScore}%</span>
          </div>
        </div>

        <div className="text-xs text-gray-400 pt-2 flex justify-between">
          <span>Domain: {quiz.domain || 'General'}</span>
          <span>Created by: {quiz.createdBy?.name || 'Instructor'}</span>
        </div>
      </div>

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Included Questions ({quiz.questions?.length || 0})
          </h2>
          {isOwner && (
            <button
              onClick={handleOpenAddModal}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
            >
              + Link From Question Bank
            </button>
          )}
        </div>

        {(!quiz.questions || quiz.questions.length === 0) ? (
          <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center">
            <p className="text-gray-500 text-sm">No questions have been linked to this quiz yet.</p>
            {isOwner && (
              <button
                onClick={handleOpenAddModal}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Add Questions Now
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {quiz.questions.map((question, index) => (
              <div
                key={question._id || index}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">
                      {question.type?.replace('_', ' ')}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                      Diff: {question.difficulty} ({question.difficultyLevel})
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                      {question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}
                    </span>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => handleRemoveQuestion(question._id, question.content)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="text-gray-900 font-medium text-base">
                  {question.content}
                </div>

                {/* Options List */}
                <div className="space-y-2 pt-2">
                  {question.options?.map((option, optIdx) => {
                    // For teachers/interviewers, highlight the correct option!
                    const isCorrect = option.isCorrect === true;

                    return (
                      <div
                        key={option._id || optIdx}
                        className={`p-3 rounded-lg border text-sm flex items-center justify-between ${
                          isCorrect
                            ? 'bg-green-50 border-green-300 text-green-900 font-semibold'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="h-5 w-5 rounded-full border border-gray-300 text-xs flex items-center justify-center font-bold text-gray-500">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{option.text}</span>
                        </div>
                        {isCorrect && (
                          <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded">
                            ✓ Correct Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation (only shown if present in payload; backend strips for students) */}
                {question.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900">
                    <span className="font-bold">Explanation: </span>
                    {question.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add Questions from Bank */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add Questions to Quiz</h3>
                <p className="text-xs text-gray-500">Select questions from your question bank</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddQuestionsSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {loadingQuestions ? (
                  <div className="text-center py-8 text-gray-500 text-sm">Loading available questions...</div>
                ) : availableQuestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No available questions found to add. All existing questions are already in this quiz or bank is empty.
                  </div>
                ) : (
                  availableQuestions.map((q) => {
                    const isChecked = selectedToAdd.includes(q._id);
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
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedToAdd([...selectedToAdd, q._id]);
                            } else {
                              setSelectedToAdd(selectedToAdd.filter(qid => qid !== q._id));
                            }
                          }}
                          className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1 text-sm">
                          <div className="font-semibold text-gray-900">{q.content}</div>
                          <div className="flex gap-2 text-xs text-gray-500 mt-1">
                            <span className="font-medium text-blue-600">{q.topic}</span>
                            <span>&bull;</span>
                            <span>Diff: {q.difficulty}</span>
                            <span>&bull;</span>
                            <span>{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-600 font-medium">
                  {selectedToAdd.length} question(s) selected
                </span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={selectedToAdd.length === 0}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
                  >
                    Add Selected
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizDetails;
