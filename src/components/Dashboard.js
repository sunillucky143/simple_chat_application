import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      
      <div className="mb-6">
        <p className="text-gray-700">Welcome, {user?.email}!</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Link
          to="/profile"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded text-center"
        >
          Profile
        </Link>
        
        <Link
          to="/form"
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded text-center"
        >
          Submit Form
        </Link>
        
        <Link
          to="/chat"
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded text-center"
        >
          Chat
        </Link>
        
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-4 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;