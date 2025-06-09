import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser } from '../services/apiService';

const UserProfile = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(authUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        setError('');
      } catch (err) {
        setError('Failed to load profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">User Profile</h2>
      
      <div className="mb-4">
        <p className="text-gray-700 font-bold">Email:</p>
        <p id="user-email" className="text-gray-600">{user?.email}</p>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-700 font-bold">User ID:</p>
        <p className="text-gray-600">{user?.id}</p>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-700 font-bold">Created At:</p>
        <p className="text-gray-600">{user?.createdAt}</p>
      </div>
    </div>
  );
};

export default UserProfile;