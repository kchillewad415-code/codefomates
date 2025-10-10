import React, { useEffect, useState, useRef } from "react";
import API from "../api";

export default function ProfilePage() {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const skillInputRef = useRef(null);
  const skillOptions = [
    "JavaScript", "Python", "Java", "C++", "React", "Node.js", "TypeScript", "HTML", "CSS", "SQL", "Go", "Ruby", "PHP", "Swift", "Kotlin", "Rust", "Dart", "Angular", "Vue.js", ".NET", "Spring", "Express", "MongoDB", "Firebase", "GraphQL"
  ];
  const [available, setAvailable] = useState(true);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("loginProfile")));
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [badges, setBadges] = useState([]);
  // Redirect to login if not logged in, after loading
  React.useEffect(() => {
    if (!loading && (!user || !user._id)) {
      window.location.replace('/login');
    }
  }, [loading, user]);
  useEffect(() => {
    const fetchUser = () => {
      setLoading(true);
      if (user) {
        setBio(user.bio || "");
        setLinkedin(user.linkedin || "");
        setGithub(user.github || "");
        setBadges(user.badges || []);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);
  const addSkill = () => {
    const trimmedSkill = newSkill.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      setSkills([...skills, trimmedSkill]);
    }
    setNewSkill("");
    setShowSuggestions(false);
  };
  const updateUser = async (id, updateData) => {
    try {
      await API.put(`/users/${updateData._id}`, updateData);
    } catch (err) {
      console.log(err);
    }
  };
  const updateSkill = () => {
    // Merge old and new skills into a flat array
    const oldSkills = Array.isArray(user.skills) ? user.skills : [];
    const allSkills = Array.from(new Set([...oldSkills, ...skills]));
    console.log("user", user);
    const updateLoginUser = {
      ...user,
      skills: allSkills,
      bio,
      linkedin,
      github,
      badges,
    };

    console.log("updateLoginUser", updateLoginUser);
    updateUser(user._id, updateLoginUser);
    setUser(updateLoginUser);
    localStorage.removeItem('loginProfile');
    localStorage.setItem('loginProfile', JSON.stringify(updateLoginUser));
    alert("user profile updated");
  };
  const removeSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  // Filter suggestions based on input
  const filteredSuggestions = skillOptions.filter(
    option => option.toLowerCase().includes(newSkill.toLowerCase()) && !skills.includes(option)
  );

  return (
    <div className="bg-gray-100 p-6" style={{ minHeight: 'calc(100vh - 300px)' }}>
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-6">
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
            <h2 className="text-3xl font-bold text-blue-600 mb-4">Your Profile</h2>
            <h3>
              {user?.username}
              {user?.email}
            </h3>
            {/* Editable Bio/About Section */}
            <div className="mb-4">
              <label className="block text-lg font-medium mb-1">Bio/About</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl"
                placeholder="Write something about yourself..."
                rows={3}
              />
            </div>
            {/* Editable Contact Info */}
            <div className="mb-4">
              <label className="block text-lg font-medium mb-1">LinkedIn</label>
              <input
                type="text"
                value={linkedin}
                onChange={e => setLinkedin(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl"
                placeholder="LinkedIn profile URL"
              />
              <label className="block text-lg font-medium mb-1 mt-2">GitHub</label>
              <input
                type="text"
                value={github}
                onChange={e => setGithub(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl"
                placeholder="GitHub profile URL"
              />
            </div>
            {/* Editable Badges (for admin or future use) */}
            <div className="mb-4">
              <label className="block text-lg font-medium mb-1">Badges (comma separated)</label>
              <input
                type="text"
                value={badges.join(", ")}
                onChange={e => setBadges(e.target.value.split(",").map(b => b.trim()))}
                className="w-full px-4 py-2 border rounded-xl"
                placeholder="e.g. Top Solver, Quick Responder"
              />
            </div>
            {/* Availability Toggle */}
            <div className="flex items-center mb-6">
              <label className="text-lg font-medium mr-4">Available for helping:</label>
              <button
                onClick={() => setAvailable(!available)}
                className={`px-4 py-2 rounded-xl text-white ${available ? "bg-teal-700" : "bg-gray-500"
                  }`}
              >
                {available ? "Yes" : "No"}
              </button>
            </div>

            {/* Skill Tags */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Your Skills:</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills && skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 relative">
                <input
                  ref={skillInputRef}
                  type="text"
                  value={newSkill}
                  onChange={(e) => {
                    setNewSkill(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Add a new skill"
                  className="px-4 py-2 border rounded-xl flex-1"
                  autoComplete="off"
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-300 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((option, idx) => (
                      <div
                        key={option}
                        className="px-4 py-2 cursor-pointer hover:bg-blue-100 text-gray-700"
                        onMouseDown={() => {
                          setNewSkill(option);
                          setShowSuggestions(false);
                          skillInputRef.current.focus();
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={addSkill}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="mb-6"></div>
              <button
                onClick={updateSkill}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 mt-10"
              >Update Profile</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
