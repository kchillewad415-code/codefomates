import React from 'react';
import './App.css';
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import IssueForm from "./pages/IssueForm";
import Dashboard from "./pages/Dashboard";
import LiveSession from "./pages/LiveSession";
import ProfilePage from "./pages/ProfilePage";
import About from "./pages/About";
import ContactPage from "./pages/ContactPage";
import HomePage from './pages/HomePage';
import Footer from "./pages/Footer";
import logo from "./Images/logo.png";
import API from "../src/api";
import ProfileLandingPage from './pages/ProfileLandingPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';
function App() {
  const [loggedUser, setLoggedUser] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLoginUser = (data) => {
    setLoggedUser(data);
  };
  useEffect(() => {
    const storedUserProfile = localStorage.getItem('loginProfile');
    if (storedUserProfile) {
      const loginUserProfile = JSON.parse(storedUserProfile);
      setLoggedUser(loginUserProfile);
    }
  }, []);
  const updateUser = async (id, updateData) => {
    try {
      const { password, ...rest } = updateData;
      await API.put(`/users/${updateData._id}`, rest);
      localStorage.removeItem('loginProfile');
      localStorage.clear();
      setLoggedUser({});
      window.location.replace("/login");
    } catch (err) {
      console.log(err);
      console.log("update User called inside error", err);
    }
  };
  const logoutUser = () => {
    const updateLoggedUser = {
      ...loggedUser,
      isOnline: false,
    };
    updateUser(updateLoggedUser._id, updateLoggedUser);
  };
  return (
    <div className="App min-h-screen flex flex-col">
      <Router>
        {/* Header and nav */}
        <div className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between relative">
            <div className="w-full flex justify-center md:justify-start md:w-auto">
              <Link to="/">
                <img height="50" style={{ height: "75px", width: "auto" }} className="mx-auto md:mx-0 cursor-pointer" width="50" alt='CodeForMates' src={logo} />
              </Link>
            </div>
            {/* Hamburger menu for mobile - absolutely positioned top right */}
            <div className="md:hidden absolute top-4 right-4">
              <button
                onClick={() => setMenuOpen(true)}
                className="text-gray-700 focus:outline-none"
                aria-label="Open menu"
              >
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
            {/* Desktop nav */}
            <nav className="flex flex-col gap-2 mt-2 text-gray-700 text-sm font-medium md:flex-row md:gap-4 md:mt-0 md:items-center hidden md:flex">
              <Link to="/">Home</Link>
              <Link to="/issue">Submit Issue</Link>
              {loggedUser.isOnline ? (<Link to="/profile">Profile</Link>) : null}
              <Link to="/about">About</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/dashboard">Dashboard</Link>
              {loggedUser && loggedUser.isOnline ? (
                <div className="flex items-center space-x-3">
                  {/* Stylish circular user icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="8" r="4" />
                    <rect x="6" y="16" width="12" height="4" rx="2" />
                  </svg>
                  <button
                    onClick={() => logoutUser()}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">
                  <Link to="/login">Login / Sign Up</Link>
                </div>
              )}
            </nav>
          </div>
          {/* Mobile menu overlay */}
          {/* Animated mobile menu overlay and panel */}
          {menuOpen && (
            <div
              className="fixed inset-0 z-50 flex justify-end pointer-events-none"
              tabIndex={-1}
              aria-modal="true"
              role="dialog"
            >
              {/* Overlay with backdrop blur */}
              <div
                className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
                onClick={() => setMenuOpen(false)}
              />
              {/* Slide-in menu panel with shadow, border, rounded corners, gradient, and focus trap */}
              <div
                className={`bg-gradient-to-br from-white via-blue-50 to-blue-100 w-64 h-full shadow-2xl border-l-4 border-blue-200 p-6 flex flex-col gap-6 relative transition-all duration-300 transform pointer-events-auto scale-100 opacity-100`}
                style={{ transitionProperty: 'transform, opacity' }}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Escape') setMenuOpen(false);
                }}
              >
                <button
                  onClick={() => setMenuOpen(false)}
                  className="absolute top-4 right-4 text-gray-700"
                  aria-label="Close menu"
                >
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" /></svg>
                </button>
                {/* Animated menu items */}
                <div className="flex flex-col gap-4 mt-8">
                  <Link to="/" onClick={() => setMenuOpen(false)} className="hover:underline transition-all duration-300 opacity-0 translate-y-4 animate-fadein">
                    <span className="flex items-center gap-2">
                      {/* Home icon (unchanged) */}
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3" /></svg>
                      Home
                    </span>
                  </Link>
                  <Link to="/issue" onClick={() => setMenuOpen(false)} className="hover:underline transition-all duration-300 opacity-0 translate-y-4 animate-fadein delay-75">
                    <span className="flex items-center gap-2">
                      {/* Notepad and pen icon for Submit Issue */}
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                        <path d="M8 2v4" />
                        <path d="M16 2v4" />
                        <path d="M4 10h16" />
                        <path d="M12 14l2 2l4-4" />
                        <path d="M12 14v4" />
                      </svg>
                      Submit Issue
                    </span>
                  </Link>
                  {loggedUser.isOnline ? (
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className="hover:underline transition-all duration-300 opacity-0 translate-y-4 animate-fadein delay-150">
                      <span className="flex items-center gap-2">
                        {/* User icon for Profile */}
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M6 20v-2a6 6 0 0112 0v2" /></svg>
                        Profile
                      </span>
                    </Link>
                  ) : null}
                  <Link to="/about" onClick={() => setMenuOpen(false)} className="hover:underline transition-all duration-300 opacity-0 translate-y-4 animate-fadein delay-200">
                    <span className="flex items-center gap-2">
                      {/* Star icon for About */}
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 9 8.5 12 2" /></svg>
                      About
                    </span>
                  </Link>
                  <Link to="/contact" onClick={() => setMenuOpen(false)} className="hover:underline transition-all duration-300 opacity-0 translate-y-4 animate-fadein delay-300">
                    <span className="flex items-center gap-2">
                      {/* Mail icon for Contact */}
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3 7 12 13 21 7" /></svg>
                      Contact
                    </span>
                  </Link>
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="hover:underline transition-all duration-300 opacity-0 translate-y-4 animate-fadein delay-500">
                    <span className="flex items-center gap-2">
                      {/* Dashboard icon (unchanged) */}
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                      Dashboard
                    </span>
                  </Link>
                  {loggedUser && loggedUser.isOnline ? (
                    <div className="flex items-center space-x-3 transition-all duration-300 opacity-0 translate-y-4 animate-fadein delay-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="8" r="4" />
                        <rect x="6" y="16" width="12" height="4" rx="2" />
                      </svg>
                      <button
                        onClick={() => { setMenuOpen(false); logoutUser(); }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-300 opacity-0 translate-y-4 animate-fadein delay-900">
                      <span className="flex items-center gap-2">
                        {/* Key icon for Login/Sign Up */}
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="15" cy="15" r="4" /><path d="M15 11V7a4 4 0 10-8 0v4" /><path d="M7 15h8" /></svg>
                        <Link to="/login" onClick={() => setMenuOpen(false)}>Login / Sign Up</Link>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Main content area grows to fill space above footer */}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthPage
              onLoginUser={handleLoginUser}
            />} />
            <Route path="/issue" element={<IssueForm
              loginUserId={loggedUser._id}
            />} />
            <Route path="/dashboard/livesession/:roomId" element={<LiveSession user={loggedUser} />} />
            <Route path="/profile" element={<ProfileLandingPage loginUser={loggedUser} />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/profile/editProfile" element={<ProfilePage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
        <Footer />
      </Router>
    </div>
  );
}

export default App;

/* Add keyframes for fadein animation in your CSS (App.css or global):
@keyframes fadein {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadein {
  animation: fadein 0.4s forwards;
}
*/