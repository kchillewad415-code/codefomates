import React from 'react';
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../api";
import Carousel from './IssuesCarousel';

export default function HomePage({ onlineUsers, animate }) {

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
          <section className="w-full max-w-4xl text-center mb-4">
            <p className="w-full text-gray-600 flex flex-col md:flex-row justify-around">
              <p><strong>{issues.length}</strong> {issues.length<=1 ? "developer" : "developers"} currently need help</p><p><strong><span className={animate ? "count animate" : "count"}>{onlineUsers}</span></strong> {onlineUsers<=1 ? "solver" : "solvers"} online</p>
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
          <div className="max-w-4xl w-full mt-10">
            { issues.length>0 &&
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white shadow-xl rounded-2xl p-6 mb-6 flex flex-col"
            >
              <div className='mb-6 flex flex-row justify-between'>
                <h2 className='text-3xl font-bold text-blue-600 relative'>Issues</h2>
                          <div className="text-blue-600 rounded-xl hover:text-blue-800 transition">
                <Link to="/dashboard">
                <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 640 640" 
                className="w-10 h-10"
                fill="currentColor">
                <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM361 417C351.6 426.4 336.4 426.4 327.1 417C317.8 407.6 317.7 392.4 327.1 383.1L366.1 344.1L216 344.1C202.7 344.1 192 333.4 192 320.1C192 306.8 202.7 296.1 216 296.1L366.1 296.1L327.1 257.1C317.7 247.7 317.7 232.5 327.1 223.2C336.5 213.9 351.7 213.8 361 223.2L441 303.2C450.4 312.6 450.4 327.8 441 337.1L361 417.1z"/>
                </svg>
                </Link>
              </div>

              </div>
                          
            <Carousel items={issues} />

            </motion.div>}
          </div>
        </>
      )}
    </div>
  );
}