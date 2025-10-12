import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import axios from "axios";
const API_URL = process.env.REACT_APP_API_BASE_URL;
function SkillList({ skills }) {
  if (!skills || skills.length === 0) return <div className="text-gray-500">No skills Added</div>;
  return (
    <div className="mb-4">
      <h3 className="text-lg font-medium mb-2">Your Skills:</h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, idx) => (
          <span
            key={idx}
            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
  // End of SkillList
}
function ResolvedIssues({ issues, setResolvedCount }) {
  const storedUserProfile = JSON.parse(localStorage.getItem('loginProfile'));
  const resolved = issues.filter(issue => issue.resolvedBy === storedUserProfile.username);
  setResolvedCount(resolved.length);
  if (resolved.length === 0) return <p className="text-gray-500 text-center">No issues resolved yet</p>;
  return (
    <div className="mt-6">
      <h3 className="text-xl font-bold text-blue-600 mb-4">Resolved Issues</h3>
      <div className="grid gap-4">
        {resolved.map((issue) => (
          <div
            key={issue._id}
            className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className="text-xl md:text-left font-semibold text-gray-800">
                {issue.title}
              </h3>
              <p className="text-sm text-gray-600">
                Language: {issue.language} · Urgency: {issue.urgency}
              </p>
            </div>
            {issue.solution && <div className="relative group inline-block m-auto">
              <svg class="w-5 h-5 text-blue-500 cursor-pointer" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M8 2v4"></path><path d="M16 2v4"></path><path d="M4 10h16"></path><path d="M12 14l2 2l4-4"></path><path d="M12 14v4"></path></svg>

              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap 
        bg-gray-800 text-white text-sm px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 
        transition-opacity duration-200">
                Solution: {issue.solution}
              </span>
            </div>}
            <div className="mt-4 sm:mt-0 bg-teal-700 text-white px-4 py-2 rounded-xl hover:bg-teal-800">
              <Link to={`livesession/${issue._id}`}>session</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function IssueList({ issues, markClosed, onDelete }) {

  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [chatRoomUsers, setChatRoomUsers] = useState([]);
  const [openPopupId, setOpenPopupId] = useState(null);

  const handleButtonClick = (issue) => {
    console.log("issues", issue);
    setOpenPopupId(issue._id);
    setIsOpen(true);
    console.log("issue id", openPopupId);
    axios.get(`${API_URL}/chat/${issue._id}`).then(res => {
      if (res.data) {
        console.log("resdata", res.data);
        const uniqueUsers = Array.from(
          new Map(res.data.map(item => [item.sender, item])).values()
        );
        const storedUserProfile = JSON.parse(localStorage.getItem('loginProfile'));

        const filtered = uniqueUsers.filter(user => user.sender !== storedUserProfile.username);
        console.log("uniqueUsers", uniqueUsers);
        setChatRoomUsers(filtered);
      };
    }).catch((err) => console.log(err));
    console.log("chatRoomUsers", chatRoomUsers);
  };

  const handleClose = () => {
    setOpenPopupId(null);
    setIsOpen(false);
    setSelectedOption("");
    setChatRoomUsers([]);
  };

  const handleChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const deleteIssue = async (issueId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this item?");
    if (!confirmDelete) return;
    try {
      const res = await API.delete(`/issues/${issueId}`);
      alert(res.data.message || "Deleted successfully");
      onDelete(issueId);
      // Update UI after delete
      // setItems(prev => prev.filter(item => item._id !== id));
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Error deleting item");
    }
  };

  if (!issues || issues.length === 0) return <p className="text-gray-500 text-center">No issue logged till</p>;
  return (
    <div className="mt-6">
      <h3 className="text-xl font-bold text-blue-600 mb-4">Created Issues</h3>
      {issues.map((issue) => (
        <div
          key={issue._id}
          className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between my-5"
        >
          <div>
            <h3 className="text-xl md:text-left font-semibold text-gray-800">{issue.title}</h3>
            <p className="text-sm text-gray-600">Language: {issue.language} · Urgency: {issue.urgency}</p>
          </div>
          {issue.solution && <div className="relative group inline-block m-auto">
            <svg class="w-5 h-5 text-blue-500 cursor-pointer" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M8 2v4"></path><path d="M16 2v4"></path><path d="M4 10h16"></path><path d="M12 14l2 2l4-4"></path><path d="M12 14v4"></path></svg>

            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap 
        bg-gray-800 text-white text-sm px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 
        transition-opacity duration-200">
              Solution: {issue.solution}
            </span>
          </div>}
          <div className="flex gap-2 mt-4 justify-between sm:mt-0">
            <div style={{ cursor: 'pointer' }} onClick={() => handleButtonClick(issue)} className="bg-teal-700 text-white px-4 py-2 rounded-xl hover:bg-teal-800">
              {issue.isOpen ? "Close Issue" : "ReOpen"}
            </div>
            {openPopupId === issue._id && (
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center">
                <div className="bg-white border-4 border-blue-700 shadow-2xl rounded-2xl px-4 py-6 text-gray-900 w-[90vw] max-w-md sm:px-8 relative animate-fade-in">
                  <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-blue-700 text-xl"
                    onClick={() => handleClose()}
                    aria-label="Close popup"
                  >
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="16" y2="16" /><line x1="16" y1="4" x2="4" y2="16" /></svg>
                  </button>
                  <div>
                    <div className="flex items-center mb-4">
                      <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3 text-blue-700"><path d="M12 19v-6m0 0V5m0 8l-4-4m4 4l4-4" /></svg>
                      <span className="font-extrabold text-blue-700 text-lg">{issue.isOpen ? "want to give a credit" : "want to send a notification to the previous resolver"}</span>
                    </div>
                    <h2>Select an Option</h2>
                    <select value={selectedOption} onChange={handleChange}>
                      <option value="">--Choose--</option>
                      {chatRoomUsers && chatRoomUsers.map((user) => (
                        <option key={user._id} value={user.sender}>{user.sender}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="mt-4 w-full bg-blue-700 text-white py-2 rounded-xl hover:bg-blue-800 font-bold"
                    onClick={() => { markClosed(issue, !issue.isOpen, selectedOption); handleClose() }}
                  >
                    {issue.isOpen ? "Close" : "ReOpen"}
                  </button>
                </div>
              </div>
            )}
            <Link to={`/issue/${issue._id}`} className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">
              Edit
            </Link>
            <button onClick={() => deleteIssue(issue._id)} class="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700">delete</button>
            <Link to={`/dashboard/livesession/${issue._id}`} className="bg-gray-600 hidden md:block text-white px-4 py-2 rounded-xl hover:bg-gray-700">
              Session
            </Link>
          </div>
          <Link to={`/dashboard/livesession/${issue._id}`} className="bg-gray-600 md:hidden text-white px-4 py-2 rounded-xl hover:bg-gray-700 mt-3">
            Session
          </Link>
        </div>
      ))}
    </div>)
}

export default function ProfileLandingPage({ loginUser }) {
  // Redirect to login if not logged in
  const [issues, setIssues] = useState([]);
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(true);
  const [allIssues, setAllIssues] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [resolvedCount, setResolvedCount] = useState();
  // Badge icon/description mapping
  const badgeMap = {
    "Top Solver": { icon: "🏆", description: "Solved 10+ issues" },
    "Quick Responder": { icon: "⚡", description: "Responded within 1 hour" },
    // Add more badge mappings as needed
  };

  useEffect(() => {
    async function fetchAll() {
      if (!loginUser || !loginUser._id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [issuesRes, usersRes] = await Promise.all([
          API.get("/issues"),
          API.get("/users")
        ]);
        setAllIssues(issuesRes.data);
        setAllUsers(usersRes.data);
        setIssues(issuesRes.data.filter(item => item.userid === loginUser._id));
        setUser(usersRes.data.find(item => item._id === loginUser._id));
      } catch (err) {
        console.log(err);
      }
      setLoading(false);
    }
    fetchAll();
  }, [loginUser && loginUser._id]);
  React.useEffect(() => {
    if (!loading && (!loginUser || !loginUser._id)) {
      window.location.replace('/login');
    }
  }, [loading, loginUser]);
  const updateIssue = async (id, updateIssue) => {
    try {
      await API.put(`/issues/${id}`, updateIssue);
    } catch (err) {
      console.log(err);
    }
  };
  const handleSubmitNotification = async (updateIssues) => {
    const user = allUsers.find(u => u.username === updateIssues.resolvedBy);
    try {
      await API.post("https://codeformates-backend.vercel.app/reOpenNotification", { user: user, issue: updateIssues });
    } catch (err) {
      console.log(err);
    }
  };

  const markClosed = (issue, value, selectedOption) => {
    const updateIssues = { ...issue, isOpen: value, resolvedBy: selectedOption };
    console.log("updateIssues", updateIssues);
    console.log("selectedOption", selectedOption);
    updateIssue(updateIssues._id, updateIssues);
    setIssues(prevIssues => prevIssues.map(i => i._id === updateIssues._id ? { ...i, isOpen: value } : i));
    handleSubmitNotification(updateIssues);
  };
  const handleDeleteIssue = (id) => {
    setIssues((prevIssues) => prevIssues.filter((issue) => issue._id !== id));
  };
  return (
    <div className="bg-gray-100 p-6" style={{ minHeight: 'calc(100vh - 300px)' }}>
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span className="mt-2 text-blue-600">Loading profile...</span>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-blue-600 mb-6">Profile Details <span className="text-orange-600">({loginUser.username})</span></h2>

            <div className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 mb-6">
              <Link to="/profile/editProfile">Edit Profile</Link>
            </div>

            <div className="grid gap-4">
              {loginUser ? (
                <div className="grid gap-4">
                  {/* Bio/About Section */}
                  <div className="bg-white rounded-xl shadow p-4 mb-2">
                    <h3 className="text-lg font-bold text-blue-700 mb-2">About</h3>
                    <p className="text-gray-700">{user?.bio || "No bio added yet."}</p>
                  </div>
                  {/* Contact Information */}
                  <div className="bg-white rounded-xl shadow p-4 mb-2">
                    <h3 className="text-lg font-bold text-blue-700 mb-2">Contact Info</h3>
                    <p className="text-gray-700">Email: {user?.email}</p>
                    {user?.linkedin && <p className="text-gray-700">LinkedIn: <a href={user.linkedin} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{user.linkedin}</a></p>}
                    {user?.github && <p className="text-gray-700">GitHub: <a href={user.github} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{user.github}</a></p>}
                  </div>
                  {/* Issue Statistics */}
                  <div className="bg-white rounded-xl shadow p-4 mb-2 flex gap-8">
                    <div>
                      <h3 className="text-lg font-bold text-blue-700 mb-2">Issue Stats</h3>
                      <p className="text-gray-700">Total: {issues.length}</p>
                      <p className="text-gray-700">Open: {issues.filter(i => i.isOpen).length}</p>
                      <p className="text-gray-700">Closed: {issues.filter(i => !i.isOpen).length}</p>
                      <p className="text-gray-700">Resolved:{resolvedCount}</p>
                    </div>
                    {/* Badges/Achievements */}
                    <div>
                      <h3 className="text-lg font-bold text-blue-700 mb-2">Badges</h3>
                      <div className="flex gap-2 flex-wrap">
                        {(user?.badges && user.badges.length > 0) ? (
                          user.badges.map((badge, idx) => {
                            const map = badgeMap[badge] || {};
                            return (
                              <div key={badge + idx} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm flex items-center gap-2" title={map.description || badge}>
                                {map.icon && <span>{map.icon}</span>} {badge}
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-gray-500">No badges yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <SkillList skills={user && user.skills} />
                  <IssueList issues={issues} markClosed={markClosed} onDelete={handleDeleteIssue} />
                  <ResolvedIssues issues={allIssues} setResolvedCount={setResolvedCount} />
                </div>
              ) : (
                <div>
                  you are not logged in please login first
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">
                    <Link to="/login">Login / Sign Up</Link>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
