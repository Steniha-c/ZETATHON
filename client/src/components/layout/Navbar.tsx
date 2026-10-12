import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, User, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', href: '/#hero' },
    { name: 'About', href: '/#about' },
    { name: 'Open Innovation', href: '/#challenges' },
    { name: 'Timeline', href: '/#timeline' },
    { name: 'Prizes', href: '/#prizes' },
    { name: 'Rules', href: '/#rules' },
    { name: 'FAQ', href: '/#faq' },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith('/#')) {
      const elementId = href.replace('/#', '');
      if (location.pathname !== '/') {
        navigate(`/#${elementId}`);
      } else {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? isAdminRoute
            ? 'bg-white/90 backdrop-blur-xl border-b border-pink-200/90 shadow-[0_4px_25px_rgba(244,114,182,0.18)] py-3'
            : 'bg-[#07090e]/85 backdrop-blur-xl border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.8)] py-3'
          : isAdminRoute
          ? 'bg-pink-50/70 backdrop-blur-md border-b border-pink-200/60 py-5'
          : 'bg-transparent border-b border-white/5 py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo / Wordmark */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className={`relative w-10 h-10 rounded-xl overflow-hidden border p-[1px] bg-white transition-transform duration-300 group-hover:scale-105 ${
              isAdminRoute
                ? 'border-pink-300 shadow-[0_0_15px_rgba(244,114,182,0.3)]'
                : 'border-cyan-500/40 shadow-[0_0_20px_rgba(0,242,254,0.35)]'
            }`}>
              <img
                src="/zeta-logo.jpg"
                alt="ZETA Logo"
                className="w-full h-full object-cover rounded-[10px]"
              />
              <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                isAdminRoute ? 'bg-pink-400/20' : 'bg-cyan-400/20'
              }`} />
            </div>

            <div className="flex flex-col">
              <span className={`text-xl font-black tracking-widest font-mono flex items-center gap-1.5 ${
                isAdminRoute ? 'text-slate-900' : 'text-white'
              }`}>
                ZETATHON
                <span className={`inline-block w-2 h-2 rounded-full animate-pulse ${
                  isAdminRoute ? 'bg-pink-500' : 'bg-cyan-400'
                }`} />
              </span>
              <span className={`text-[9px] uppercase tracking-widest font-mono font-bold ${
                isAdminRoute ? 'text-pink-600' : 'text-cyan-400/90'
              }`}>
                ZETA • MONARCH LEVEL
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.href)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors rounded-lg cursor-pointer ${
                  isAdminRoute
                    ? 'text-slate-700 hover:text-pink-600 hover:bg-pink-100/60'
                    : 'text-slate-300 hover:text-cyan-400 hover:bg-white/5'
                }`}
              >
                {link.name}
              </button>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      isAdminRoute
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_2px_12px_rgba(244,114,182,0.4)]'
                        : 'bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 hover:border-purple-400'
                    }`}
                  >
                    <Shield className={`w-3.5 h-3.5 ${isAdminRoute ? 'text-white' : 'text-purple-400'}`} />
                    Admin Panel
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 hover:border-cyan-400 transition-all"
                  >
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    Team Dashboard
                  </Link>
                )}

                <button
                  onClick={logout}
                  title="Sign out"
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isAdminRoute
                      ? 'border-pink-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50'
                      : 'border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-950/20'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    isAdminRoute ? 'text-slate-700 hover:text-pink-600' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Log In
                </Link>

                <Link
                  to="/register"
                  className={`relative group overflow-hidden px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                    isAdminRoute
                      ? 'text-white bg-gradient-to-r from-pink-500 to-rose-500 shadow-[0_0_20px_rgba(244,114,182,0.4)]'
                      : 'text-black bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,242,254,0.3)]'
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-1.5 font-bold">
                    Register Now
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {isAuthenticated && (
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className={`p-2 rounded-lg border ${
                  isAdminRoute
                    ? 'bg-pink-100 text-pink-700 border-pink-200'
                    : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                }`}
              >
                {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2.5 rounded-xl border transition-all ${
                isAdminRoute
                  ? 'border-pink-200 bg-white/90 text-slate-700 hover:text-pink-600'
                  : 'border-white/10 bg-slate-900/80 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30'
              }`}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className={`lg:hidden border-b backdrop-blur-2xl overflow-hidden shadow-2xl ${
              isAdminRoute
                ? 'border-pink-200 bg-white/95 text-slate-800'
                : 'border-cyan-500/20 bg-[#07090e]/95'
            }`}
          >
            <div className="px-5 pt-3 pb-6 space-y-2 max-w-7xl mx-auto">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold uppercase tracking-wider transition-colors flex items-center justify-between ${
                    isAdminRoute
                      ? 'text-slate-700 hover:text-pink-600 hover:bg-pink-100/60'
                      : 'text-slate-300 hover:text-cyan-400 hover:bg-white/5'
                  }`}
                >
                  <span>{link.name}</span>
                  <ChevronRight className={`w-4 h-4 ${isAdminRoute ? 'text-pink-400' : 'text-slate-600'}`} />
                </button>
              ))}

              <div className={`pt-4 border-t flex flex-col gap-2.5 ${isAdminRoute ? 'border-pink-200' : 'border-white/10'}`}>
                {isAuthenticated ? (
                  <>
                    <Link
                      to={isAdmin ? '/admin' : '/dashboard'}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`w-full py-3 rounded-xl text-center text-xs font-bold uppercase tracking-wider border ${
                        isAdminRoute
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent shadow-md'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}
                    >
                      {isAdmin ? 'Admin Console' : 'Go To Team Dashboard'}
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full py-2.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider border ${
                        isAdminRoute
                          ? 'border-pink-200 text-slate-600 hover:text-rose-600'
                          : 'border-white/10 text-slate-400 hover:text-rose-400'
                      }`}
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`w-full py-3 rounded-xl text-center font-mono text-xs font-bold uppercase tracking-wider ${
                        isAdminRoute
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                          : 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(0,242,254,0.3)]'
                      }`}
                    >
                      Register Now
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`w-full py-2.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider border ${
                        isAdminRoute
                          ? 'border-pink-200 text-slate-700 hover:text-pink-600'
                          : 'border-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
