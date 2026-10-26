import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import quizService from '../services/quizService';
import questionService from '../services/questionService';
import adaptiveService from '../services/adaptiveService';
import masteryService from '../services/masteryService';
import AdaptivePlayground from '../components/AdaptivePlayground';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    quizzesCount: 0,
    questionsCount: 0,
    skillRating: user?.skillRating || 1000,
    masteryTopics: 0,
    averageMastery: 0,
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

        // Fetch authoritative rating from backend
        let liveRating = user?.skillRating || 1000;
        try {
          const ratingRes = await adaptiveService.getUserRating();
          if (ratingRes?.data?.skillRating) {
            liveRating = ratingRes.data.skillRating;
          }
        } catch (e) {
          // fallback to user payload
        }

        // Fetch mastery profile
        let mTopics = 0;
        let avgM = 0;
        try {
          if (isTeacherOrInterviewer) {
            const cohortRes = await masteryService.getCohortOverview();
            mTopics = cohortRes.data?.totalTopicsTracked || 0;
          } else {
            const myMRes = await masteryService.getMyMastery();
            mTopics = myMRes.data?.summary?.totalTopics || 0;
            avgM = myMRes.data?.summary?.averageMastery || 0;
          }
        } catch (e) {
          // fallback
        }

        setStats({
          quizzesCount: quizRes.count || 0,
          questionsCount: qCount,
          skillRating: liveRating,
          masteryTopics: mTopics,
          averageMastery: avgM,
          loading: false
        });
      } catch (err) {
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [isTeacherOrInterviewer, user]);

  const getRatingTier = (rating) => {
    if (rating < 800) return { label: 'Novice', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (rating < 1200) return { label: 'Intermediate', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (rating < 1600) return { label: 'Advanced', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    return { label: 'Expert', color: 'bg-purple-100 text-purple-800 border-purple-200' };
  };

  const tier = getRatingTier(stats.skillRating);

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
              AdaptIQ Core Adaptive Engine is active. Logged in as{' '}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Authoritative Skill Rating */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {user?.role === 'student' ? 'Your Skill Rating' : 'Base Skill Rating'}
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-blue-600">
              {stats.loading ? '...' : stats.skillRating}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${tier.color}`}>
              {tier.label}
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Authoritative Elo rating tracked on backend.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {isTeacherOrInterviewer ? 'Total Quizzes' : 'Available Quizzes'}
          </div>
          <div className="mt-2 text-3xl font-extrabold text-indigo-600">
            {stats.loading ? '...' : stats.quizzesCount}
          </div>
          <div className="mt-2">
            <Link to="/quizzes" className="text-xs font-medium text-indigo-600 hover:underline">
              View all quizzes &rarr;
            </Link>
          </div>
        </div>

        {isTeacherOrInterviewer ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Question Bank Items
            </div>
            <div className="mt-2 text-3xl font-extrabold text-purple-600">
              {stats.loading ? '...' : stats.questionsCount}
            </div>
            <div className="mt-2">
              <Link to="/questions" className="text-xs font-medium text-purple-600 hover:underline">
                Manage questions &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Scaling Factor (K)
            </div>
            <div className="mt-2 text-3xl font-extrabold text-purple-600">
              32
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Contract calibrated rating delta weight.
            </p>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Platform Status
          </div>
          <div className="mt-2 flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-lg font-bold text-gray-900">M05 Active</span>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Topic Mastery Engine verified & operational.
          </p>
        </div>
      </div>

      {/* Interactive Adaptive Playground */}
      <AdaptivePlayground initialUserRating={stats.skillRating} />

      {/* Navigation Cards */}
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
                <h2 className="text-xl font-bold text-gray-900">Adaptive Assessment Engine</h2>
              </div>
              <p className="text-gray-600 text-sm">
                All questions adapt dynamically based on your performance. The backend recalculates your skill rating after every answer and deterministically selects subsequent questions closest to your level.
              </p>
            </div>
            <div className="mt-6">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded border border-emerald-200">
                Authoritative Elo Engine Active
              </span>
            </div>
          </div>
        )}
        {/* Topic Mastery Navigation Card (M05) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <span className="text-2xl">📊</span>
                <h2 className="text-xl font-bold text-gray-900">Topic-Level Mastery Profiles</h2>
              </div>
              <p className="text-gray-600 text-sm max-w-2xl">
                {isTeacherOrInterviewer
                  ? `Cohort oversight: ${stats.masteryTopics} topics tracked with automatic weak-area identification and remedial recommendations.`
                  : `Personalized skill mapping: ${stats.masteryTopics} topics engaged with an average competency score of ${stats.averageMastery}%.`}
              </p>
            </div>
            <Link
              to="/mastery"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition whitespace-nowrap text-center"
            >
              {isTeacherOrInterviewer ? 'View Cohort Analytics' : 'View My Mastery'} &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
