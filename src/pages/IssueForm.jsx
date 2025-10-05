import React from 'react';
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import API from "../api";

export default function IssueForm({loginUserId}) {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    language: "",
    customLanguage: "",
    urgency: "now",
  });
  
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const submitIssue = async (issueData) => {
    try {
      await API.post("/issues", issueData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setShowSuccessPopup(true);
    } catch (err) {
      console.error("Error submitting issue:", err);
    }

    setForm({
      title: "",
      description: "",
      language: "",
      customLanguage: "",
      urgency: "now",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalLanguage = form.language === "custom" ? form.customLanguage : form.language;
    const file = selectedFile ? selectedFile : null;
    console.log("loginUserId", loginUserId);
    const issueData = {
      ...form,
      language: finalLanguage,
      file: file,
      userid:loginUserId,
    };
    delete issueData.customLanguage;
    submitIssue(issueData);
  };

  const [showPopup, setShowPopup] = useState(!loginUserId);

  return (
    <div className="relative bg-gray-100 flex justify-center p-4" style={{ minHeight: 'calc(100vh - 300px)' }}>
      {/* Blur background when popup is shown */}
      <div className={`${!loginUserId && showPopup ? 'fixed inset-0 z-40 backdrop-blur-sm bg-black/10' : ''}`}></div>
      {/* Show popup above the form if not logged in and not closed */}
      {!loginUserId && showPopup && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center">
          <div className="bg-white border-4 border-blue-700 shadow-2xl rounded-2xl px-4 py-6 text-gray-900 w-[90vw] max-w-md sm:px-8 relative animate-fade-in">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-blue-700 text-xl"
              onClick={() => setShowPopup(false)}
              aria-label="Close popup"
            >
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></svg>
            </button>
            <div className="flex items-center mb-4">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3 text-blue-700"><path d="M12 19v-6m0 0V5m0 8l-4-4m4 4l4-4"/></svg>
              <span className="font-extrabold text-blue-700 text-lg">Login Recommended</span>
            </div>
            <div className="text-base mb-3 font-medium">For best experience, please login before submitting an issue.</div>
            <div className="text-sm text-gray-600 mb-2">Login helps you track your issues, receive notifications, and get better support.</div>
            <div className="text-xs font-bold text-blue-700 bg-blue-100 rounded px-2 py-1 mt-2">You can submit without login, but logging in is recommended.</div>
          </div>
        </div>
      )}
      {/* Success popup after issue submission */}
      {showSuccessPopup && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center">
          <div className="bg-white border-4 border-blue-700 shadow-2xl rounded-2xl px-4 py-6 text-gray-900 w-[90vw] max-w-md sm:px-8 relative animate-fade-in">
            <div className="flex items-center mb-4">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3 text-blue-700"><circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M10 16l4 4 8-8" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
              <span className="font-extrabold text-blue-700 text-lg">Issue Submitted!</span>
            </div>
            <div className="text-base mb-3 font-medium">Your issue has been submitted successfully.</div>
            <button
              className="mt-4 w-full bg-blue-700 text-white py-2 rounded-xl hover:bg-blue-800 font-bold"
              onClick={() => { setShowSuccessPopup(false); navigate('/profile'); }}
            >
              OK
            </button>
          </div>
        </div>
      )}
      {/* Always show the form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-xl space-y-4"
        style={{ zIndex: 10 }}
      >
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-4">
          Submit a Coding Issue
        </h2>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Issue Title"
          className="w-full px-4 py-2 border rounded-xl"
          required
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe your problem..."
          rows="5"
          className="w-full px-4 py-2 border rounded-xl"
          required
        />
        <div className="space-y-2">
          <select
            name="language"
            value={form.language}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-xl"
            required
          >
            <option value="">Select Language/Tech</option>
            <option value="JavaScript">JavaScript</option>
            <option value="Python">Python</option>
            <option value="Java">Java</option>
            <option value="C++">C++</option>
            <option value="React">React</option>
            <option value="Node.js">Node.js</option>
            <option value="TypeScript">TypeScript</option>
            <option value="HTML">HTML</option>
            <option value="CSS">CSS</option>
            <option value="SQL">SQL</option>
            <option value="Go">Go</option>
            <option value="Ruby">Ruby</option>
            <option value="PHP">PHP</option>
            <option value="Swift">Swift</option>
            <option value="Kotlin">Kotlin</option>
            <option value="Rust">Rust</option>
            <option value="Dart">Dart</option>
            <option value="Angular">Angular</option>
            <option value="Vue.js">Vue.js</option>
            <option value=".NET">.NET</option>
            <option value="Spring">Spring</option>
            <option value="Express">Express</option>
            <option value="MongoDB">MongoDB</option>
            <option value="Firebase">Firebase</option>
            <option value="GraphQL">GraphQL</option>
            <option value="custom">Other (Type below)</option>
          </select>
          {form.language === "custom" && (
            <input
              type="text"
              name="customLanguage"
              value={form.customLanguage}
              onChange={handleChange}
              placeholder="Enter language or technology name"
              className="w-full px-4 py-2 border rounded-xl"
              required
            />
          )}
        </div>
        <div className="flex gap-4 items-center">
          <label className="font-medium text-gray-700">Urgency:</label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="urgency"
              value="now"
              checked={form.urgency === "now"}
              onChange={handleChange}
            />
            Now
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="urgency"
              value="later"
              checked={form.urgency === "later"}
              onChange={handleChange}
            />
            Later
          </label>
        </div>
        <div className="flex items-center">
          <label className="font-medium text-gray-700">
              Attach File
            </label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.pdf,.txt,.js,.ts,.py,.java,.zip"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full border px-3 py-2 rounded-xl mb-4"
            />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700"
        >
          Submit Issue
        </button>
      </form>
    </div>
  );
}
