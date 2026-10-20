import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Quizzes from './pages/Quizzes';
import QuizDetails from './pages/QuizDetails';
import QuizForm from './pages/QuizForm';
import Questions from './pages/Questions';
import QuestionForm from './pages/QuestionForm';

// Simple wrapper to prevent authenticated users from seeing login/register
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Dashboard / Home */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Quizzes Routes */}
      <Route
        path="/quizzes"
        element={
          <ProtectedRoute>
            <Layout>
              <Quizzes />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quizzes/new"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'interviewer']}>
            <Layout>
              <QuizForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quizzes/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <QuizDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quizzes/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'interviewer']}>
            <Layout>
              <QuizForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Questions Bank Routes (Teacher / Interviewer only) */}
      <Route
        path="/questions"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'interviewer']}>
            <Layout>
              <Questions />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/questions/new"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'interviewer']}>
            <Layout>
              <QuestionForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/questions/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'interviewer']}>
            <Layout>
              <QuestionForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
