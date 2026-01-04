import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Login, Register } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import VideoPlayer from './pages/VideoPlayer';
import Landing from './pages/Landing';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
    return user ? children : <Navigate to="/" />;
};

const PublicRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
    return user ? <Navigate to="/dashboard" /> : children;
};

function App() {
  return (
    <AuthProvider>
        <SocketProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
                    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                    <Route 
                        path="/dashboard" 
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/watch/:id" 
                        element={
                            <PrivateRoute>
                                <VideoPlayer />
                            </PrivateRoute>
                        } 
                    />
                </Routes>
            </Router>
        </SocketProvider>
    </AuthProvider>
  );
}

export default App;
