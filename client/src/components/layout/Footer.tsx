import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowUp } from 'lucide-react';
import { HACKATHON_CONFIG } from '../../hackathon.config.js';

const COPYRIGHT_YEAR = new Date().getFullYear();

export const Footer: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isAdminRoute) {
    return (
      <footer className="admin-footer">
        <div className="admin-footer__inner">
          <span>© {COPYRIGHT_YEAR} ZETATHON · Organizer workspace</span>
          <Link to="/">Return to the public event site</Link>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`relative pt-16 pb-12 overflow-hidden z-20 ${
      isAdminRoute
        ? 'border-t border-pink-200/90 bg-white/90 text-slate-700'
        : 'border-t border-white/10 bg-[#040609] text-slate-400'
    }`}>
      {/* Top subtle glow bar */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-[1.5px] bg-gradient-to-r from-transparent ${
        isAdminRoute ? 'via-pink-400/60' : 'via-cyan-500/40'
      } to-transparent`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b ${
          isAdminRoute ? 'border-pink-200' : 'border-white/10'
        }`}>
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl overflow-hidden border p-[1px] bg-white ${
                isAdminRoute
                  ? 'border-pink-300 shadow-[0_0_15px_rgba(244,114,182,0.3)]'
                  : 'border-cyan-500/40 shadow-[0_0_20px_rgba(0,242,254,0.3)]'
              }`}>
                <img
                  src="/zeta-logo.jpg"
                  alt="ZETA Logo"
                  className="w-full h-full object-cover rounded-[10px]"
                />
              </div>
              <div>
                <span className={`text-2xl font-black font-mono tracking-widest block ${
                  isAdminRoute ? 'text-slate-900' : 'text-white'
                }`}>
                  ZETATHON
                </span>
                <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                  isAdminRoute ? 'text-pink-600' : 'text-cyan-400'
                }`}>
                  ZETA • MONARCH LEVEL
                </span>
              </div>
            </div>

            <p className={`text-sm max-w-sm leading-relaxed ${
              isAdminRoute ? 'text-slate-600' : 'text-slate-400'
            }`}>
              8 HOURS. ONE CHALLENGE. INFINITE POSSIBILITIES.
              An internal sprint hackathon created and organized by the ZETA Student Club to empower future-ready builders.
            </p>

            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold ${
              isAdminRoute
                ? 'border-pink-200 bg-pink-100/80 text-pink-700'
                : 'border-cyan-500/20 bg-cyan-950/20 text-cyan-400'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-ping ${isAdminRoute ? 'bg-pink-500' : 'bg-cyan-400'}`} />
              STATUS: REGISTRATIONS LIVE
            </div>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={HACKATHON_CONFIG.socialLinks.github}
                target="_blank"
                rel="noreferrer"
                className={`p-2.5 rounded-xl border transition-all ${
                  isAdminRoute
                    ? 'border-pink-200 bg-pink-50 text-slate-600 hover:text-pink-600 hover:border-pink-300 hover:bg-pink-100'
                    : 'border-white/10 bg-slate-900/50 text-slate-400 hover:text-white hover:border-cyan-500/40 hover:bg-cyan-500/10'
                }`}
                aria-label="GitHub"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href={HACKATHON_CONFIG.socialLinks.instagram}
                target="_blank"
                rel="noreferrer"
                className={`p-2.5 rounded-xl border transition-all ${
                  isAdminRoute
                    ? 'border-pink-200 bg-pink-50 text-slate-600 hover:text-pink-600 hover:border-pink-300 hover:bg-pink-100'
                    : 'border-white/10 bg-slate-900/50 text-slate-400 hover:text-pink-400 hover:border-pink-500/40 hover:bg-pink-500/10'
                }`}
                aria-label="Instagram"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                </svg>
              </a>
              <a
                href={HACKATHON_CONFIG.socialLinks.linkedin}
                target="_blank"
                rel="noreferrer"
                className={`p-2.5 rounded-xl border transition-all ${
                  isAdminRoute
                    ? 'border-pink-200 bg-pink-50 text-slate-600 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50'
                    : 'border-white/10 bg-slate-900/50 text-slate-400 hover:text-sky-400 hover:border-sky-500/40 hover:bg-sky-500/10'
                }`}
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.8v-7.6h-2.8M7.86 6.3a1.64 1.64 0 1 0 1.64 1.64c0-.9-.73-1.64-1.64-1.64z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-widest font-mono ${
              isAdminRoute ? 'text-slate-900' : 'text-slate-200'
            }`}>
              Navigation
            </h4>
            <ul className={`space-y-2 text-sm ${isAdminRoute ? 'text-slate-600' : 'text-slate-400'}`}>
              <li>
                <a href="/#about" className={`transition-colors ${isAdminRoute ? 'hover:text-pink-600' : 'hover:text-cyan-400'}`}>
                  What is ZETATHON
                </a>
              </li>
              <li>
                <a href="/#challenges" className={`transition-colors ${isAdminRoute ? 'hover:text-pink-600' : 'hover:text-cyan-400'}`}>
                  Open Innovation Track
                </a>
              </li>
              <li>
                <a href="/#timeline" className={`transition-colors ${isAdminRoute ? 'hover:text-pink-600' : 'hover:text-cyan-400'}`}>
                  8-Hour Schedule
                </a>
              </li>
              <li>
                <a href="/#prizes" className={`transition-colors ${isAdminRoute ? 'hover:text-pink-600' : 'hover:text-cyan-400'}`}>
                  Prizes & Awards
                </a>
              </li>
              <li>
                <a href="/#rules" className={`transition-colors ${isAdminRoute ? 'hover:text-pink-600' : 'hover:text-cyan-400'}`}>
                  Rules & Evaluation
                </a>
              </li>
              <li>
                <a href="/#faq" className={`transition-colors ${isAdminRoute ? 'hover:text-pink-600' : 'hover:text-cyan-400'}`}>
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* Portals & Actions */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-widest font-mono ${
              isAdminRoute ? 'text-slate-900' : 'text-slate-200'
            }`}>
              Portals
            </h4>
            <ul className={`space-y-2 text-sm ${isAdminRoute ? 'text-slate-600' : 'text-slate-400'}`}>
              <li>
                <Link to="/register" className={`transition-colors ${isAdminRoute ? 'hover:text-pink-600' : 'hover:text-cyan-400'}`}>
                  Team Registration
                </Link>
              </li>
              <li>
                <Link to="/login" className={`transition-colors ${isAdminRoute ? 'hover:text-pink-600' : 'hover:text-cyan-400'}`}>
                  Participant Login
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className={`transition-colors ${isAdminRoute ? 'hover:text-pink-600' : 'hover:text-cyan-400'}`}>
                  Project Submission Portal
                </Link>
              </li>
              <li>
                <Link to="/admin" className={`transition-colors ${isAdminRoute ? 'text-pink-600 font-semibold hover:text-pink-700' : 'hover:text-cyan-400'}`}>
                  Admin & Organizing Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-widest font-mono ${
              isAdminRoute ? 'text-slate-900' : 'text-slate-200'
            }`}>
              Contact Desk
            </h4>
            <ul className={`space-y-2.5 text-sm ${isAdminRoute ? 'text-slate-600' : 'text-slate-400'}`}>
              <li className="flex items-center gap-2">
                <Mail className={`w-4 h-4 shrink-0 ${isAdminRoute ? 'text-pink-500' : 'text-cyan-400'}`} />
                <a href={`mailto:${HACKATHON_CONFIG.contactDetails.email}`} className={`text-xs font-mono transition-colors ${isAdminRoute ? 'hover:text-pink-600' : 'hover:text-cyan-400'}`}>
                  {HACKATHON_CONFIG.contactDetails.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className={`w-4 h-4 shrink-0 ${isAdminRoute ? 'text-pink-500' : 'text-cyan-400'}`} />
                <a href={`tel:${HACKATHON_CONFIG.contactDetails.phone.replace(/\s+/g, '')}`} className={`text-xs font-mono transition-colors ${isAdminRoute ? 'hover:text-pink-600' : 'hover:text-cyan-400'}`}>
                  {HACKATHON_CONFIG.contactDetails.phone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${isAdminRoute ? 'text-pink-500' : 'text-cyan-400'}`} />
                <span className="text-xs leading-relaxed">{HACKATHON_CONFIG.contactDetails.address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
          isAdminRoute ? 'text-slate-500' : 'text-slate-500'
        }`}>
          <p>© {COPYRIGHT_YEAR} ZETATHON. Crafted with passion by ZETA Student Club. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <a href="#rules" className={`transition-colors ${isAdminRoute ? 'hover:text-slate-700' : 'hover:text-slate-300'}`}>Code of Conduct</a>
            <a href="#rules" className={`transition-colors ${isAdminRoute ? 'hover:text-slate-700' : 'hover:text-slate-300'}`}>Terms of Entry</a>
            <button
              onClick={scrollToTop}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isAdminRoute
                  ? 'border-pink-200 hover:border-pink-400 text-slate-500 hover:text-pink-600 bg-pink-50/50'
                  : 'border-white/10 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-400'
              }`}
              title="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
