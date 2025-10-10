import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";

export default function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSkillFilter, setShowSkillFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // You can adjust as needed
  const techOptions = [
    "JavaScript", "Python", "Java", "C++", "React", "Node.js", "TypeScript", "HTML", "CSS", "SQL", "Go", "Ruby", "PHP", "Swift", "Kotlin", "Rust", "Dart", "Angular", "Vue.js", ".NET", "Spring", "Express", "MongoDB", "Firebase", "GraphQL"
  ];
  const urgencyOptions = ["Now", "Later"];
  const [selectedTech, setSelectedTech] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("");
  // Get logged-in user and skills from localStorage
  const loggedUser = (() => {
    const stored = localStorage.getItem('loginProfile');
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
  }
  if (filter) {
    filteredIssues = filteredIssues.filter(i => i.title && i.title.toLowerCase().includes(filter.toLowerCase()));
  }
  if (showSkillFilter && userSkills.length > 0) {
    filteredIssues = filteredIssues.filter(i => userSkills.includes(i.language.toLowerCase()));
  }
  if (urgencyFilter) {
    filteredIssues = filteredIssues.filter(i => i.urgency === urgencyFilter.toLocaleLowerCase());
  }
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // 1️⃣ On mount → Read filters + pagination from URL
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const filterParam = queryParams.get("filter") || "";
    const selectedTechParam = queryParams.get("selectedTech") || "";
    const showSkillFilterParam = queryParams.get("showSkillFilter") === "true";
    const pageParam = parseInt(queryParams.get("page")) || 1;
    const limitParam = parseInt(queryParams.get("limit")) || itemsPerPage; // default itemsPerPage
    const urgencyParam = queryParams.get("urgency") || "";
    setFilter(filterParam);
    setSelectedTech(selectedTechParam);
    setShowSkillFilter(showSkillFilterParam);
    setCurrentPage(pageParam);
    setItemsPerPage(limitParam);
    setUrgencyFilter(urgencyParam); // Reset urgency filter on load
    setIsInitialLoad(false);
  }, []);
  // 2️⃣ On filters or pagination change → Update URL (skip first render)
  useEffect(() => {
    if (isInitialLoad) return; // Prevent wiping URL on first render
    const queryParams = new URLSearchParams();
    // Filters
    if (filter) queryParams.append("filter", filter);
    if (selectedTech) queryParams.append("selectedTech", selectedTech);
    if (showSkillFilter) queryParams.append("showSkillFilter", showSkillFilter);
    if (urgencyFilter) queryParams.append("urgency", urgencyFilter);
    // Pagination
    if (currentPage > 1) queryParams.append("page", currentPage);
    if (itemsPerPage) queryParams.append("limit", itemsPerPage); // skip default to keep URL clean
    const newUrl = `${window.location.pathname}${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
    window.history.replaceState(null, "", newUrl);
  }, [filter, selectedTech, showSkillFilter, currentPage, itemsPerPage, isInitialLoad, urgencyFilter]);
  // Pagination logic
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredIssues.slice(indexOfFirstItem, indexOfLastItem);
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Optional — scroll to top on page change
  };
  const handleNext = () => {
    if (currentPage < totalPages) handlePageChange(currentPage + 1);
  };
  const handlePrev = () => {
    if (currentPage > 1) handlePageChange(currentPage - 1);
  };
  const handleChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setItemsPerPage(value);
    setCurrentPage(1); // reset to first page when per-page changes
  };
  const pageNumbers = [];
  const maxVisible = 1; // how many pages around the current one to show
  const totalVisible = maxVisible + 1; // ensure current + next is visible
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, currentPage + 1);
  // Adjust when near start
  if (currentPage <= 2) {
    endPage = Math.min(totalPages, 3);
  }
  // Adjust when near end
  if (currentPage >= totalPages - 1) {
    startPage = Math.max(1, totalPages - 2);
  }
  // Add first page
  if (startPage > 1) {
    if (startPage >= 2) pageNumbers.push("left-ellipsis");
  }
  // Add visible range
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  // Add last page
  if (endPage < totalPages) {
    if (endPage <= totalPages - 1) pageNumbers.push("right-ellipsis");
  }
  return (
    <div className="bg-gray-100 p-6" style={{ minHeight: 'calc(100vh - 300px)' }}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-600 mb-6 relative">Solver Dashboard
        </h2>
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Filter by Title"
              value={filter}
              onChange={(e) => { setFilter(e.target.value); }}
              className="w-full sm:w-1/2 px-4 py-2 border rounded-xl"
            />
            <select
              value={selectedTech}
              onChange={e => { setSelectedTech(e.target.value); }}
              className="w-full sm:w-1/2 px-4 py-2 border rounded-xl"
            >
              <option value="">Filter by Language/Tech</option>
              {techOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <select
              value={urgencyFilter}
              onChange={e => { setUrgencyFilter(e.target.value); }}
              className="w-full sm:w-1/2 px-4 py-2 border rounded-xl"
            >
              <option value="">Filter by urgency</option>
              {urgencyOptions.map(opt => (
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
          <>
          <div className="text-3xl font-bold text-blue-600 inline-flex justify-between w-full items-center mb-4">
          <div className="text-sm text-gray-600">
            <label htmlFor="paginationCount">Items per page :  </label>
            <select id="paginationCount" value={itemsPerPage} onChange={handleChange} style={{ borderRadius: '20px', padding: '5px', marginLeft: '5px' }}>
              <option key="1" value="1">1</option>
              <option key="2" value="5">5</option>
              <option key="3" value="10">10</option>
              <option key="4" value="20">20</option>
            </select>
          </div>
          <div className="text-sm text-gray-600"><span>Total Pages present : <span className="md:inline-block w-[25px]">{totalPages}</span></span></div>
            </div>
            <div className="grid gap-4">
              {currentItems.length > 0 ? (
                currentItems.map((issue) => (
                  <div
                    key={issue._id}
                    className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {issue.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-3">
                        Language: {issue.language}<span className={
                          issue.urgency === "now"
                            ? "text-red-700 bg-red-100 border border-red-400 px-2 py-0.5 rounded ml-2"
                            : "text-green-700 bg-green-100 border border-green-400 px-2 py-0.5 rounded ml-2"
                        }>Urgency: {issue.urgency}</span>
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
            {totalPages > 1 &&
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${currentPage === 1
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                >
                  Prev
                </button>
                {
                  pageNumbers.map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === "number" && handlePageChange(page)}
                      disabled={page === "left-ellipsis" || page === "right-ellipsis"}
                      className={`px-3 py-1 rounded mx-1 ${page === "left-ellipsis" || page === "right-ellipsis"
                        ? "cursor-default text-gray-400"
                        : currentPage === page
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300"
                        }`}
                    >
                      {page === "left-ellipsis"
                        ? "..."
                        : page === "right-ellipsis"
                          ? "..."
                          : page}
                    </button>
                  ))}
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${currentPage === totalPages
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                >
                  Next
                </button>
              </div>
            }

          </>
        )}
      </div>
    </div>
  );
}
