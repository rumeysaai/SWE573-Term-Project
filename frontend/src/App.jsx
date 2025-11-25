// src/App.jsx

import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './api'; 
import { Toaster } from 'sonner';

import Home from './pages/Home';
import Post from './pages/Post';
import Negotiation from './pages/Negotiation';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';

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
  // 5. GÜNCELLENMİŞ CONTEXT: setUser'ı ekledik
  const authContextValue = {
    user,
    setUser, 
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <Toaster richColors position="top-right" />
      <Router>
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
            path="/post/:postId"
            element={<ProtectedRoute><Post /></ProtectedRoute>}
          />
          <Route
            path="/negotiate/:postId"
            element={<ProtectedRoute><Negotiation /></ProtectedRoute>}
          />
          <Route
            path="/profile"
            element={<ProtectedRoute><Profile /></ProtectedRoute>}
          />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}