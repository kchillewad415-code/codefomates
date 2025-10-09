import React from 'react';
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../api";

export default function HomePage() {

  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dummy simulated real-time count fetching
    const fetchIssues = async () => {
      setLoading(true);
      API.get("/issues")
        .then(res => {
          const resIssues = res.data.filter(item => item.isOpen === true);
          setIssues(resIssues);
          setLoading(false);
        })
        .catch(err => {
          setLoading(false);
          console.log(err);
        });
    };
    fetchIssues();
    const fetchusers = async () => {
      setLoading(true);
      API.get("/users")
        .then(res => {
          const resUsers = res.data.filter(item => item.isOnline === true);
          setUsers(resUsers);
          setLoading(false);
        })
        .catch(err => {
          setLoading(false);
          console.log(err);
        });
    };
    fetchusers();
  }, []);

  return (
    <div className=" bg-gray-100 flex flex-col items-center p-6">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-40">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span className="mt-2 text-blue-600">Loading data...</span>
        </div>
      ) : (
        <>
          <section className="text-center mb-4">
            <p className="text-gray-600">
              <strong>{issues.length}</strong> developers currently need help · <strong>{users.length}</strong> solvers online
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            {/* Needy Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white shadow-xl rounded-2xl p-6 flex flex-col items-center"
            >
              <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
              <p className="text-gray-600 text-center mb-6">
                Log your coding issue, and we’ll connect you to a real developer who’s ready to help.
              </p>
              <div className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition">
                <Link to="/issue">I Need Help</Link>
              </div>
            </motion.div>

            {/* Solver Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="bg-white shadow-xl rounded-2xl p-6 flex flex-col items-center"
            >
              <h2 className="text-2xl font-semibold mb-4">Want to Help?</h2>
              <p className="text-gray-600 text-center mb-6">
                Join as a problem solver and pick issues you can solve in your own time. No pressure.
              </p>
              <div className="bg-teal-700 text-white px-6 py-2 rounded-xl hover:bg-teal-800 transition">
                <Link to="/dashboard">I Want to Help</Link>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
