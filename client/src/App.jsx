import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import api from './services/api';

function Home() {
  const [health, setHealth] = useState({ status: 'Loading...', message: '' });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await api.get('/health');
        setHealth({ status: 'Success', message: response.data.message });
      } catch (error) {
        console.error("Health check failed", error);
        setHealth({ status: 'Error', message: error.message });
      }
    };
    
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">AdaptIQ</h1>
        <p className="text-gray-700 mb-6">M01 MERN Foundation is running.</p>
        
        <div className="bg-gray-50 border border-gray-200 rounded p-4 text-left">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Backend Connection</h2>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-700">Status:</span>
            <span className={`px-2 py-1 text-xs font-semibold rounded ${health.status === 'Success' ? 'bg-green-100 text-green-800' : health.status === 'Error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {health.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">Message:</span>
            <span className="text-sm text-gray-600">{health.message || '...'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
