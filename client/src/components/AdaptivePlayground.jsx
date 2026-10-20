import React, { useState, useEffect } from 'react';
import adaptiveService from '../services/adaptiveService';

const AdaptivePlayground = ({ initialUserRating = 1000 }) => {
  const [userRating, setUserRating] = useState(initialUserRating);
  const [questionDifficulty, setQuestionDifficulty] = useState(1100);
  const [result, setResult] = useState(1);
  const [responseTime, setResponseTime] = useState(30);
  const [expectedTime, setExpectedTime] = useState(30);
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCalculation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adaptiveService.calculateRating({
        userRating: Number(userRating),
        questionDifficulty: Number(questionDifficulty),
        result: Number(result),
        responseTime: Number(responseTime),
        expectedTime: Number(expectedTime)
      });
      setCalculation(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Calculation error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalculation();
  }, [userRating, questionDifficulty, result, responseTime, expectedTime]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">⚡</span>
            <h3 className="text-lg font-bold text-gray-900">Adaptive Engine Simulator</h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Backend authoritative Elo rating engine ($K=32$, Initial $S=1000$).
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
          Server-Calculated
        </span>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Current Skill Rating (S): <strong className="text-blue-600 font-bold">{userRating}</strong>
          </label>
          <input
            type="range"
            min="500"
            max="2500"
            step="10"
            value={userRating}
            onChange={(e) => setUserRating(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>500 (Novice)</span>
            <span>1000 (Base)</span>
            <span>2500 (Master)</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Question Difficulty (D): <strong className="text-indigo-600 font-bold">{questionDifficulty}</strong>
          </label>
          <input
            type="range"
            min="500"
            max="2500"
            step="10"
            value={questionDifficulty}
            onChange={(e) => setQuestionDifficulty(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>Easy (600)</span>
            <span>Medium (1000)</span>
            <span>Hard (1400)</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Assessment Outcome (R)
          </label>
          <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <button
              type="button"
              onClick={() => setResult(1)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
                result === 1
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ✓ Correct (R=1)
            </button>
            <button
              type="button"
              onClick={() => setResult(0)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
                result === 0
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ✗ Incorrect (R=0)
            </button>
          </div>
        </div>
      </div>

      {/* Engine Results Dashboard */}
      {calculation && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase block">Expected Score (E)</span>
            <span className="text-xl font-black text-gray-800">
              {(calculation.expectedScore * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">probability</span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase block">Scaling Factor (K)</span>
            <span className="text-xl font-black text-gray-800">{calculation.kFactor}</span>
            <span className="text-[10px] text-gray-400 block mt-0.5">constant</span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase block">Rating Shift (&Delta;S)</span>
            <span className={`text-xl font-black ${
              calculation.ratingDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {calculation.ratingDelta >= 0 ? `+${calculation.ratingDelta}` : calculation.ratingDelta}
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">points adjusted</span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase block">New Rating (S_new)</span>
            <span className="text-xl font-black text-blue-600">
              {calculation.newRating}
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">updated rating</span>
          </div>
        </div>
      )}

      {/* Formula Footnote */}
      <div className="text-xs text-gray-500 bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-gray-700">Contract Formula: </span>
          <code>E = 1 / (1 + 10^((D - S)/400))</code> &bull; <code>S_new = S + K * (R - E)</code>
        </div>
        <span className="text-[11px] text-blue-600 font-medium">Deterministic & Verified</span>
      </div>
    </div>
  );
};

export default AdaptivePlayground;
