import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  if (!user) return null;

  const isTeacherOrInterviewer = user.role === 'teacher' || user.role === 'interviewer';

  const navLinkClass = (path) => {
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    return `px-3 py-2 rounded-md text-sm font-medium transition ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
    }`;
  };

  const roleBadgeColor = {
    student: 'bg-blue-100 text-blue-800 border-blue-200',
    teacher: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    interviewer: 'bg-purple-100 text-purple-800 border-purple-200'
  }[user.role] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-black text-blue-600 tracking-tight">AdaptIQ</span>
            </Link>
            <div className="hidden md:flex space-x-2">
              <Link to="/" className={navLinkClass('/')}>
                Dashboard
              </Link>
              <Link to="/quizzes" className={navLinkClass('/quizzes')}>
                Quizzes
              </Link>
              <Link to="/mastery" className={navLinkClass('/mastery')}>
                Mastery
              </Link>
              {isTeacherOrInterviewer && (
                <Link to="/questions" className={navLinkClass('/questions')}>
                  Question Bank
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-semibold text-gray-800 hidden sm:inline">{user.name}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${roleBadgeColor}`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-300 hover:border-transparent rounded-md transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile nav bar */}
      <div className="md:hidden flex px-4 pb-2 space-x-2 border-t border-gray-100 pt-2 overflow-x-auto">
        <Link to="/" className={navLinkClass('/')}>Dashboard</Link>
        <Link to="/quizzes" className={navLinkClass('/quizzes')}>Quizzes</Link>
        <Link to="/mastery" className={navLinkClass('/mastery')}>Mastery</Link>
        {isTeacherOrInterviewer && (
          <Link to="/questions" className={navLinkClass('/questions')}>Question Bank</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
