import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";

export default function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSkillFilter, setShowSkillFilter] = useState(false);
  const techOptions = [
    "JavaScript", "Python", "Java", "C++", "React", "Node.js", "TypeScript", "HTML", "CSS", "SQL", "Go", "Ruby", "PHP", "Swift", "Kotlin", "Rust", "Dart", "Angular", "Vue.js", ".NET", "Spring", "Express", "MongoDB", "Firebase", "GraphQL"
  ];
  const [selectedTech, setSelectedTech] = useState("");

  // Get logged-in user and skills from sessionStorage
  const loggedUser = (() => {
    const stored = sessionStorage.getItem('loginProfile');
    return stored ? JSON.parse(stored) : null;
  })();
  const userSkills = Array.isArray(loggedUser?.skills) ? loggedUser.skills.map(s => s.toLowerCase()) : [];

  useEffect(() => {
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
  }, []);

  let filteredIssues = issues;
  if (selectedTech) {
    filteredIssues = filteredIssues.filter(i => i.language && i.language.toLowerCase() === selectedTech.toLowerCase());
  } else if (filter) {
    filteredIssues = filteredIssues.filter(i => i.language && i.language.toLowerCase().includes(filter.toLowerCase()));
  }
  if (showSkillFilter && userSkills.length > 0) {
    filteredIssues = filteredIssues.filter(i => userSkills.includes(i.language.toLowerCase()));
  }

  return (
  <div className="bg-gray-100 p-6" style={{ minHeight: 'calc(100vh - 300px)' }}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-600 mb-6">Solver Dashboard</h2>

        <div className="mb-4 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Filter by language (e.g. Python)"
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setSelectedTech(""); }}
              className="w-full sm:w-1/2 px-4 py-2 border rounded-xl"
            />
            <select
              value={selectedTech}
              onChange={e => { setSelectedTech(e.target.value); setFilter(""); }}
              className="w-full sm:w-1/2 px-4 py-2 border rounded-xl"
            >
              <option value="">Filter by Language/Tech</option>
              {techOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          {loggedUser && userSkills.length > 0 && (
            <button
              className={`px-4 py-2 rounded-xl text-white ${showSkillFilter ? "bg-blue-700" : "bg-blue-600"} hover:bg-blue-800 transition`}
              onClick={() => setShowSkillFilter(f => !f)}
            >
              {showSkillFilter ? "Show All Issues" : "Show Only My Skill Issues"}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-40">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span className="mt-2 text-blue-600">Loading issues...</span>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
                <div
                  key={issue._id}
                  className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {issue.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Language: {issue.language} · Urgency: {issue.urgency}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 bg-teal-700 text-white px-4 py-2 rounded-xl hover:bg-teal-800">
                  <Link to={`livesession/${issue._id}`}>session</Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">No issues found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
