import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import masteryService from '../services/masteryService';

const Mastery = () => {
  const { user } = useContext(AuthContext);
  const isTeacherOrInterviewer = user?.role === 'teacher' || user?.role === 'interviewer';

  // Active view for teachers: 'my' (personal/demo) vs 'cohort'
  const [viewTab, setViewTab] = useState(isTeacherOrInterviewer ? 'cohort' : 'my');

  // Student personal profile data
  const [personalData, setPersonalData] = useState({
    summary: { totalTopics: 0, averageMastery: 0, overallAccuracy: 0 },
    topics: []
  });

  // Cohort data for teachers/interviewers
  const [cohortData, setCohortData] = useState({
    totalTopicsTracked: 0,
    weakAreasCount: 0,
    strongAreasCount: 0,
    weakAreas: [],
    strongAreas: [],
    topics: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [sortBy, setSortBy] = useState('highest');

  const fetchMastery = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (domainFilter) params.domain = domainFilter;
      if (sortBy) params.sortBy = sortBy;

      if (viewTab === 'cohort' && isTeacherOrInterviewer) {
        const cohortRes = await masteryService.getCohortOverview(params);
        setCohortData(cohortRes.data || {});
      } else {
        const myRes = await masteryService.getMyMastery(params);
        setPersonalData(myRes.data || { summary: {}, topics: [] });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load mastery data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMastery();
  }, [viewTab, search, domainFilter, sortBy]);

  const getMasteryColor = (score) => {
    if (score >= 75) return { bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Proficient' };
    if (score >= 50) return { bg: 'bg-blue-500', text: 'text-blue-700', badge: 'bg-blue-50 text-blue-800 border-blue-200', label: 'Developing' };
    return { bg: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-50 text-rose-800 border-rose-200', label: 'Needs Practice' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Topic-Level Mastery</h1>
          <p className="mt-1 text-sm text-gray-600">
            {isTeacherOrInterviewer
              ? 'Analyze cohort proficiency distributions and identify areas requiring remedial attention.'
              : 'Track your competency, practice volume, and accuracy mapping across specific domains and topics.'}
          </p>
        </div>

        {/* Tab switch for instructors */}
        {isTeacherOrInterviewer && (
          <div className="flex rounded-lg border border-gray-200 p-1 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setViewTab('cohort')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                viewTab === 'cohort'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Cohort Analytics
            </button>
            <button
              type="button"
              onClick={() => setViewTab('my')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                viewTab === 'my'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👤 Personal Profile
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold ml-2">&times;</button>
        </div>
      )}

      {/* KPI Cards */}
      {viewTab === 'cohort' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Tracked Cohort Topics
            </span>
            <span className="text-3xl font-extrabold text-blue-600 mt-2 block">
              {loading ? '...' : cohortData.totalTopicsTracked || 0}
            </span>
            <span className="text-xs text-gray-400 mt-1 block">active learning areas</span>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Cohort Weak Areas (&lt; 60%)
            </span>
            <span className="text-3xl font-extrabold text-rose-600 mt-2 block">
              {loading ? '...' : cohortData.weakAreasCount || 0}
            </span>
            <span className="text-xs text-rose-500 mt-1 block font-medium">recommended for remediation</span>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Proficient Areas (&ge; 75%)
            </span>
            <span className="text-3xl font-extrabold text-emerald-600 mt-2 block">
              {loading ? '...' : cohortData.strongAreasCount || 0}
            </span>
            <span className="text-xs text-emerald-600 mt-1 block font-medium">cohort strength</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Topics Engaged
            </span>
            <span className="text-3xl font-extrabold text-blue-600 mt-2 block">
              {loading ? '...' : personalData.summary.totalTopics || 0}
            </span>
            <span className="text-xs text-gray-400 mt-1 block">evaluated topics</span>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Average Mastery
            </span>
            <span className="text-3xl font-extrabold text-indigo-600 mt-2 block">
              {loading ? '...' : `${personalData.summary.averageMastery || 0}%`}
            </span>
            <span className="text-xs text-gray-400 mt-1 block">composite score</span>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Overall Accuracy
            </span>
            <span className="text-3xl font-extrabold text-emerald-600 mt-2 block">
              {loading ? '...' : `${personalData.summary.overallAccuracy || 0}%`}
            </span>
            <span className="text-xs text-gray-400 mt-1 block">
              {personalData.summary.totalCorrect || 0} / {personalData.summary.totalAttempted || 0} correct
            </span>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Top Strength
            </span>
            <span className="text-lg font-bold text-gray-900 mt-2 block truncate">
              {loading ? '...' : personalData.summary.strongestTopic?.topic || 'N/A'}
            </span>
            <span className="text-xs text-blue-600 mt-1 block font-medium">
              {personalData.summary.strongestTopic ? `${personalData.summary.strongestTopic.masteryScore}% mastery` : 'take quizzes to unlock'}
            </span>
          </div>
        </div>
      )}

      {/* Weak Areas Alert for Instructors */}
      {viewTab === 'cohort' && cohortData.weakAreas?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start space-x-3">
          <span className="text-xl">⚠️</span>
          <div>
            <h4 className="text-sm font-bold text-amber-900">Remedial Focus Identified for Cohort</h4>
            <p className="text-xs text-amber-800 mt-0.5">
              The following topics currently fall below 60% average proficiency across learners:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {cohortData.weakAreas.map((w, idx) => (
                <span key={idx} className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                  {w.topic} ({w.averageMastery}%)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by topic name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Filter by domain (e.g. Computer Science)..."
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sm:w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="highest">Sort: Highest Mastery</option>
          <option value="lowest">Sort: Lowest Mastery</option>
          <option value="topic">Sort: Alphabetical</option>
          <option value="recent">Sort: Recently Attempted</option>
        </select>
      </div>

      {/* Table / List View */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"></div>
          <p className="text-gray-500 text-sm">Loading topic mastery breakdown...</p>
        </div>
      ) : viewTab === 'cohort' ? (
        /* Cohort Topics Table */
        cohortData.topics?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-8">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-gray-900">No cohort data available</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
              Cohort mastery accumulates automatically as students take adaptive assessments and answer questions.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Topic</th>
                  <th className="px-6 py-3 text-left font-semibold">Domain</th>
                  <th className="px-6 py-3 text-center font-semibold">Students</th>
                  <th className="px-6 py-3 text-center font-semibold">Total Attempts</th>
                  <th className="px-6 py-3 text-center font-semibold">Avg Accuracy</th>
                  <th className="px-6 py-3 text-right font-semibold">Cohort Mastery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cohortData.topics.map((t, idx) => {
                  const color = getMasteryColor(t.averageMastery);
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">{t.topic}</td>
                      <td className="px-6 py-4 text-gray-500">{t.domain}</td>
                      <td className="px-6 py-4 text-center font-medium text-gray-700">{t.studentCount}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{t.totalAttempted}</td>
                      <td className="px-6 py-4 text-center font-semibold text-gray-800">{t.averageAccuracy}%</td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${color.badge}`}>
                            {t.averageMastery}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Personal Student Topics List */
        personalData.topics?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-8">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900">No topic mastery recorded yet</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
              Answer questions in quizzes or adaptive evaluations to build your topic mastery profile.
            </p>
            <Link
              to="/quizzes"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition"
            >
              Take a Quiz Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {personalData.topics.map((t) => {
              const color = getMasteryColor(t.masteryScore);

              return (
                <div
                  key={t._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3 hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-gray-900">{t.topic}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {t.domain}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${color.badge}`}>
                        {color.label} ({t.masteryScore}%)
                      </span>
                      <span className="text-xs text-gray-400">
                        Accuracy: <strong className="text-gray-700 font-semibold">{t.accuracy}%</strong>
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${color.bg}`}
                      style={{ width: `${Math.min(100, Math.max(5, t.masteryScore))}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
                    <span>
                      {t.questionsCorrect} correct of {t.questionsAttempted} attempts
                    </span>
                    <span>
                      Last practiced: {new Date(t.lastAttemptedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default Mastery;
