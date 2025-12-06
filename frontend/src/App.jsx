// src/App.jsx

import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './api'; 
import { Toaster } from 'sonner';

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
import ForumDetails from './pages/ForumDetails';
import Admin from './pages/Admin';
import HowTo from './pages/HowTo';
import TimeBank from './pages/TimeBank';
import About from './pages/About';
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
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />; 
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user.is_staff && !user.is_superuser) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <LoadingSpinner />;
  }
  if (user) {
    
    return <Navigate to="/" replace />;
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
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 px-6 md:px-8 lg:px-12">
            <Routes>
              {/* Sadece Misafirlerin Görebileceği Rotalar */}
              <Route
                path="/login"
                element={<PublicOnlyRoute><Login /></PublicOnlyRoute>}
              />
              <Route
                path="/register" 
                element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>}
              />

              {/* Korumalı Rotalar */}
              <Route
                path="/"
                element={<ProtectedRoute><Home /></ProtectedRoute>}
              />
              <Route
                path="/post/new"
                element={<ProtectedRoute><Post /></ProtectedRoute>}
              />
              <Route
                path="/post/edit/:id"
                element={<ProtectedRoute><Post /></ProtectedRoute>}
              />
              <Route
                path="/post-details/:postId"
                element={<ProtectedRoute><PostDetails /></ProtectedRoute>}
              />
              <Route
                path="/negotiate/:postId"
                element={<ProtectedRoute><Proposal /></ProtectedRoute>}
              />
              <Route
                path="/proposal-review/:proposalId"
                element={<ProtectedRoute><ProposalReview /></ProtectedRoute>}
              />
              <Route
                path="/approval/:proposalId?"
                element={<ProtectedRoute><Approval /></ProtectedRoute>}
              />
              <Route
                path="/my-profile"
                element={<ProtectedRoute><MyProfile /></ProtectedRoute>}
              />
              <Route
                path="/profile/:username"
                element={<ProtectedRoute><Profile /></ProtectedRoute>}
              />
              <Route
                path="/forum"
                element={<ProtectedRoute><Forum /></ProtectedRoute>}
              />
              <Route
                path="/forum/:topicId"
                element={<ProtectedRoute><ForumDetails /></ProtectedRoute>}
              />
              <Route
                path="/how-to"
                element={<ProtectedRoute><HowTo /></ProtectedRoute>}
              />
              <Route
                path="/timebank"
                element={<ProtectedRoute><TimeBank /></ProtectedRoute>}
              />
              <Route
                path="/about"
                element={<ProtectedRoute><About /></ProtectedRoute>}
              />
              <Route
                path="/admin-panel"
                element={<AdminRoute><Admin /></AdminRoute>}
              />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthContext.Provider>
  );
}