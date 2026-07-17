import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Traffic from './pages/Traffic';
import Emergency from './pages/Emergency';
import Utility from './pages/Utility';
import Navigation from './pages/Navigation';
import Booking from './pages/Booking';
import Citizens from './pages/Citizens';
import Departments from './pages/Departments';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-darkbg-pure text-white flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/navigation" replace />;
  }

  return children;
};

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-darkbg-pure text-white flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
            {/* Protected Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Operator']}>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/traffic"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Traffic />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/emergency"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Operator']}>
                  <MainLayout>
                    <Emergency />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/utility"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Utility />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/navigation"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Navigation />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/booking"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Booking />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/citizens"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Operator']}>
                  <MainLayout>
                    <Citizens />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/departments"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Operator']}>
                  <MainLayout>
                    <Departments />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
