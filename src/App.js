import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChatProvider } from './context/ChatContext';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import FormPage from './pages/FormPage';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/form" 
              element={
                <PrivateRoute>
                  <FormPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <PrivateRoute>
                  <ChatPage />
                </PrivateRoute>
              } 
            />
            
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;