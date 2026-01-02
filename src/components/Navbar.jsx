import React, { useEffect, useState, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DarkModeContext } from '../context/DarkModeContext';
import logo from '../assets/logo.png';

export default function Navbar() {
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { darkMode, setDarkMode } = useContext(DarkModeContext);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Scroll hide/show
  useEffect(() => {
    const controlNavbar = () => {
      setShow(window.scrollY <= lastScrollY);
      setLastScrollY(window.scrollY);
    };
    window.addEventListener('scroll', controlNavbar, { passive: true });
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  // Collapse mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <nav
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 max-w-7xl w-[calc(100%-2rem)] bg-surface border border-border/50 shadow-sm z-50 transition-all duration-700 ease-in-out rounded-2xl ${show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div
            className="flex-shrink-0 flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate('/')}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/')}
          >
            <div className="relative">
              {/* Blur removed per user feedback */}
              <img
                src={logo}
                alt="ML Visualizer Logo"
                className="h-9 w-9 object-cover rounded-full relative z-10"
              />
            </div>
            <span className="hidden md:inline text-lg font-bold text-primary tracking-tight">
              ML Visualizer
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-1 items-center relative" ref={dropdownRef}>
            {/* Portfolio Link */}
            <a
              href="https://name-is-aryan.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary hover:bg-background rounded-lg transition-colors"
            >
              Portfolio
            </a>

            {/* Algorithms Dropdown */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary hover:bg-background rounded-lg transition-colors flex items-center gap-1 group"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              id="algorithms-button"
              type="button"
            >
              Algorithms
              <svg
                className={`h-4 w-4 transform transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-accent' : 'text-muted group-hover:text-primary'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div
                id="algorithms-menu"
                role="menu"
                aria-labelledby="algorithms-button"
                className="absolute top-full right-0 mt-2 w-56 bg-surface border border-border shadow-xl rounded-xl overflow-hidden z-50 p-1 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                {['kmeans', 'hierarchical', 'fpgrowth', 'apriori'].map((algo) => (
                  <Link
                    key={algo}
                    to={`/${algo}`}
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-secondary hover:text-primary hover:bg-background rounded-lg capitalize transition-colors"
                  >
                    {algo}
                  </Link>
                ))}
              </div>
            )}

            <div className="w-px h-6 bg-border mx-2"></div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-secondary hover:text-primary hover:bg-background rounded-lg transition-colors"
              aria-label="Toggle dark mode"
              type="button"
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              type="button"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="p-2 text-secondary hover:text-primary hover:bg-background rounded-lg transition-colors"
            >
              {menuOpen ? (
                <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden bg-surface border-t border-border shadow-lg absolute w-full left-0 rounded-b-2xl transition-all duration-300 ease-in-out overflow-hidden ${menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="flex flex-col px-4 py-4 space-y-1">
          <a
            href="https://name-is-aryan.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 rounded-xl text-secondary hover:text-primary hover:bg-background font-medium transition-colors"
          >
            Portfolio
          </a>

          {['kmeans', 'hierarchical', 'fpgrowth', 'apriori'].map((algo) => (
            <Link
              key={algo}
              to={`/${algo}`}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-secondary hover:text-primary hover:bg-background font-medium capitalize transition-colors"
            >
              {algo}
            </Link>
          ))}

          <button
            onClick={() => {
              setDarkMode(!darkMode);
              setMenuOpen(false);
            }}
            className="w-full text-left px-4 py-3 rounded-xl text-secondary hover:text-primary hover:bg-background font-medium border-t border-border mt-2 transition-colors flex items-center justify-between"
            type="button"
          >
            <span>Switch Theme</span>
            {darkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
