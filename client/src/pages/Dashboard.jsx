import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import quizService from '../services/quizService';
import questionService from '../services/questionService';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    quizzesCount: 0,
    questionsCount: 0,
    loading: true
  });

  const isTeacherOrInterviewer = user?.role === 'teacher' || user?.role === 'interviewer';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const quizRes = await quizService.getQuizzes();
        let qCount = 0;
        if (isTeacherOrInterviewer) {
          const questRes = await questionService.getQuestions();
          qCount = questRes.count || 0;
        }
        setStats({
          quizzesCount: quizRes.count || 0,
          questionsCount: qCount,
          loading: false
        });
      } catch (err) {
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [isTeacherOrInterviewer]);

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="mt-1 text-gray-600">
              AdaptIQ Quiz & Question Foundation is active. Logged in as{' '}
              <span className="font-semibold text-blue-600 capitalize">{user?.role}</span>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isTeacherOrInterviewer ? (
              <>
                <Link
                  to="/quizzes/new"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
                >
                  + Create Quiz
                </Link>
                <Link
                  to="/questions/new"
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg shadow-sm transition"
                >
                  + Add Question
                </Link>
              </>
            ) : (
              <Link
                to="/quizzes"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
              >
                Browse Quizzes
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {isTeacherOrInterviewer ? 'Total Quizzes' : 'Available Published Quizzes'}
          </div>
          <div className="mt-2 text-3xl font-extrabold text-blue-600">
            {stats.loading ? '...' : stats.quizzesCount}
          </div>
          <div className="mt-4">
            <Link to="/quizzes" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
              View all quizzes &rarr;
            </Link>
          </div>
        </div>

        {isTeacherOrInterviewer && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Question Bank Items
            </div>
            <div className="mt-2 text-3xl font-extrabold text-indigo-600">
              {stats.loading ? '...' : stats.questionsCount}
            </div>
            <div className="mt-4">
              <Link to="/questions" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                Manage questions &rarr;
              </Link>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Platform Status
          </div>
          <div className="mt-2 flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
            <span className="text-xl font-bold text-gray-900">M03 Active</span>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Quiz & Question Foundation ready for future adaptive engines.
          </p>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">📝</span>
              <h2 className="text-xl font-bold text-gray-900">Assessments & Quizzes</h2>
            </div>
            <p className="text-gray-600 text-sm">
              {isTeacherOrInterviewer
                ? 'Create, manage, and publish structured quizzes. Associate questions from your curated question bank, configure time limits, and set passing thresholds.'
                : 'Browse published assessments across various technical domains and topics. Inspect assessment metadata and prepare for evaluation.'}
            </p>
          </div>
          <div className="mt-6">
            <Link
              to="/quizzes"
              className="inline-block px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium text-sm rounded-lg transition"
            >
              Open Quizzes Module
            </Link>
          </div>
        </div>

        {isTeacherOrInterviewer ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">📚</span>
                <h2 className="text-xl font-bold text-gray-900">Question Bank Repository</h2>
              </div>
              <p className="text-gray-600 text-sm">
                Maintain question items across multiple topics. Configure difficulty ratings (100–3000), marks, multiple choices or true/false formats, and detailed learning explanations.
              </p>
            </div>
            <div className="mt-6">
              <Link
                to="/questions"
                className="inline-block px-4 py-2 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-medium text-sm rounded-lg transition"
              >
                Open Question Bank
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">🎯</span>
                <h2 className="text-xl font-bold text-gray-900">Adaptive Testing Ready</h2>
              </div>
              <p className="text-gray-600 text-sm">
                As a student, all assessments maintain strict security. Answer keys and explanations remain securely protected on the backend until adaptive evaluation sessions in upcoming milestones.
              </p>
            </div>
            <div className="mt-6">
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded">
                Protected Assessment Mode
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
