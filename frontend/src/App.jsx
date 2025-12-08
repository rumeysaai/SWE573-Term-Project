// src/App.jsx

import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './api'; 
import { Toaster } from 'sonner';

import Welcome from './pages/Welcome';
import Home from './pages/Home';
import Post from './pages/Post';
import PostDetails from './pages/PostDetails';
import Proposal from './pages/Proposal';
import ProposalReview from './pages/ProposalReview';
import Approval from './pages/Approval';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import MyProfile from './pages/MyProfile';
import Forum from './pages/Forum';
import Forums from './pages/Forums';
import TopicDetail from './pages/TopicDetail';
import AdminDashboard from './pages/AdminDashboard';
import HowTo from './pages/HowTo';
import TimeBank from './pages/TimeBank';
import About from './pages/About';
import Chat from './pages/Chat';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
    </div>
  );
}

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />; 
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />; 
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (!user.is_staff && !user.is_superuser) {
    return <Navigate to="/home" replace />;
  }
  
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <LoadingSpinner />;
  }
  if (user) {
    return <Navigate to="/home" replace />;
  }
  return children; 
}

function WelcomeRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <LoadingSpinner />;
  }
  if (user) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fonksiyonun adını 'initializeApp' olarak değiştirdik
    const initializeApp = async () => {
      try {
        // Timeout ekle - 5 saniye içinde cevap gelmezse devam et
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );

        // 1. YENİ ADIM: Önce backend'den CSRF cookie'sini iste
        // Bu çağrı bittiğinde, tarayıcı 'csrftoken' cookie'sine sahip olacak.
        await Promise.race([api.get('/csrf/'), timeoutPromise]); 

        // 2. ESKİ ADIM: Artık cookie'miz olduğuna göre session'ı kontrol et
        const response = await Promise.race([api.get('/session/'), timeoutPromise]);
        setUser(response.data);
      } catch (error) {
        // CSRF veya session'dan biri hata verirse, kullanıcı giriş yapmamıştır
        console.log('Auth check failed, user not logged in:', error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);


  const login = async (username, password) => {
    try {
      const response = await api.post('/login/', {
        username: username,
        password: password,
      });
      setUser(response.data); 
      return true; 
    } catch (error) {
      console.error("Login hatası:", error);
      return false; 
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout/');
    } catch (error) {
      console.error("Logout hatası:", error);
    } finally {
      setUser(null); 
    }
  };
 
  const authContextValue = {
    user,
    setUser, 
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <Toaster richColors position="top-right" closeButton />
      <Router>
        <Routes>
          {/* Welcome Page - No Header/Footer */}
          <Route
            path="/"
            element={<WelcomeRoute><Welcome /></WelcomeRoute>}
          />
          
          {/* Public Routes - With Header/Footer */}
          <Route
            path="/login"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <PublicOnlyRoute><Login /></PublicOnlyRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/signup"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <PublicOnlyRoute><Signup /></PublicOnlyRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/register" 
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <PublicOnlyRoute><Signup /></PublicOnlyRoute>
                </main>
                <Footer />
              </div>
            }
          />

          {/* Protected Routes - With Header/Footer */}
          <Route
            path="/home"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <ProtectedRoute><Home /></ProtectedRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/post/new"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <ProtectedRoute><Post /></ProtectedRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/post/edit/:id"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <ProtectedRoute><Post /></ProtectedRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/post-details/:postId"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <ProtectedRoute><PostDetails /></ProtectedRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/negotiate/:postId"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <ProtectedRoute><Proposal /></ProtectedRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/proposal-review/:proposalId"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <ProtectedRoute><ProposalReview /></ProtectedRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/approval/:proposalId?"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <ProtectedRoute><Approval /></ProtectedRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/my-profile"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <ProtectedRoute><MyProfile /></ProtectedRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/profile/:username"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <ProtectedRoute><Profile /></ProtectedRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/forum/new"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <ProtectedRoute><Forum /></ProtectedRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/forums"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <ProtectedRoute><Forums /></ProtectedRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/forum/:id"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <ProtectedRoute><TopicDetail /></ProtectedRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/chat"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <ProtectedRoute><Chat /></ProtectedRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/how-to"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <ProtectedRoute><HowTo /></ProtectedRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/timebank"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <ProtectedRoute><TimeBank /></ProtectedRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/about"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <ProtectedRoute><About /></ProtectedRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/admin-panel"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 px-6 md:px-8 lg:px-12">
                  <AdminRoute><AdminDashboard /></AdminRoute>
                </main>
                <Footer />
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}