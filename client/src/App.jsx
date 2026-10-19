import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';

function Home() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">AdaptIQ</h1>
        <p className="text-gray-700 mb-6">M02 Authentication is running.</p>
        
        <div className="bg-gray-50 border border-gray-200 rounded p-4 text-left">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Current User</h2>
          <div className="mb-1"><span className="font-medium text-gray-700">Name:</span> {user.name}</div>
          <div className="mb-1"><span className="font-medium text-gray-700">Email:</span> {user.email}</div>
          <div className="mb-4"><span className="font-medium text-gray-700">Role:</span> <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{user.role}</span></div>
          
          <button 
            onClick={logout}
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple wrapper to prevent authenticated users from seeing login/register
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } 
      />
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
