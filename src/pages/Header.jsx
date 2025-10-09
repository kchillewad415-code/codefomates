import React from 'react';
import { useState } from "react";
import { Link } from "react-router-dom";
export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  return (

    <div className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col items-center md:flex-row md:items-center md:justify-between">
        <div className="text-xl font-bold text-blue-600 w-full text-center md:text-left md:w-auto">CodeForMates</div>
        <nav className="flex flex-col gap-2 mt-2 text-gray-700 text-sm font-medium md:flex-row md:gap-4 md:mt-0">
          <Link to="/">Home</Link>
          <Link to="/issue">Submit Issue</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/login">Login</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/dashboard/livesession">session</Link>
          <div>
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <img
                  src="https://via.placeholder.com/32"
                  alt="avatar"
                  className="w-8 h-8 rounded-full"
                />
                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoggedIn(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}