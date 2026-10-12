import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { Navbar } from './components/layout/Navbar.js';
import { Footer } from './components/layout/Footer.js';
import { BackgroundFX } from './components/common/BackgroundFX.js';
import { ProtectedRoute } from './components/common/ProtectedRoute.js';
import { HomePage } from './pages/HomePage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { ParticipantDashboardPage } from './pages/ParticipantDashboardPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function RoutedApplication() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans relative selection:bg-cyan-500/25 selection:text-white">
      <ScrollToTop />
      {!isHome && <BackgroundFX />}
      {!isHome && <Navbar />}
      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><ParticipantDashboardPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {!isHome && <Footer />}
    </div>
  );
}

export function App() {
  return <BrowserRouter><AuthProvider><RoutedApplication /></AuthProvider></BrowserRouter>;
}

export default App;
