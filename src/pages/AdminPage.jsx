import React from 'react';
import { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";


export default function AdminPage({ user }) {
    const [currentUser, setCurrentUser] = useState();
    const [loading, setLoading] = useState(true);
    const [allIssues, setAllIssues] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchAll() {
            if (!user || !user._id) {
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
                setCurrentUser(usersRes.data.find(item => item._id === user._id));
            } catch (err) {
                console.log(err);
            }
            setLoading(false);
        }
        fetchAll();
    }, [user && user._id]);


    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("loginProfile"));
        if (!storedUser || storedUser.username !== "admin") {
            navigate("/");
        }
    });
    const handleDeleteIssue = (id) => {
        setAllIssues((prevIssues) => prevIssues.filter((issue) => issue._id !== id));
    };
    const handleDeleteUser = (id) => {
        setAllUsers((prevUsers) => prevUsers.filter((user) => user._id !== id));
    };
    return (
        <>
            {loading ? (
                <div className="flex flex-col items-center justify-center h-40">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span className="mt-2 text-blue-600">Loading issues...</span>
                </div>
            ) : (

                <div className="bg-gray-100 p-6" style={{ minHeight: 'calc(100vh - 300px)' }}>
                    <div className="max-w-4xl mx-auto">
                        <IssueList issues={allIssues} onDelete={handleDeleteIssue} />
                        <UsersList users={allUsers} onDelete={handleDeleteUser} />
                    </div>
                </div>
            )}
        </>
    );
}

function IssueList({ issues, onDelete }) {

    const [selectedItems, setSelectedItems] = useState([]);


    const displayItems = React.useMemo(() => {
  const selected = issues.filter((item) => selectedItems.includes(item._id));
  const unselected = issues.filter((item) => !selectedItems.includes(item._id));
  return [...selected, ...unselected];
}, [issues, selectedItems]);

    // Toggle single checkbox
    const handleCheckboxChange = (id) => {
        setSelectedItems((prev) =>
            prev.includes(id)
                ? prev.filter((itemId) => itemId !== id)
                : [...prev, id]
        );
    };


    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = issues.map((item) => item._id);
            setSelectedItems(allIds);
        } else {
            setSelectedItems([]);
        }
    };

    // Delete selected
    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) {
            alert("No items selected!");
            return;
        }

        if (!window.confirm("Are you sure you want to delete selected items?")) {
            return;
        }

        try {
            // Option 1: Multiple DELETE calls (simple)
            await Promise.all(
                selectedItems.map((id) => {
                    API.delete(`/issues/${id}`);
                    onDelete(id);
                })
            );
            setSelectedItems([]);
            alert("Selected items deleted successfully");
        } catch (error) {
            console.error(error);
            alert("Error deleting selected items");
        }
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

            <div className="flex items-center mb-2">
                <input
                    type="checkbox"
                    checked={selectedItems.length === issues.length && issues.length > 0}
                    onChange={handleSelectAll}
                    className="mr-2"
                />
                <span>Select All</span>

                <button
                    onClick={handleDeleteSelected}
                    className="ml-auto bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600"
                >
                    Delete Selected
                </button>
            </div>
                        <AnimatePresence>

            {displayItems.map((issue) => (
                <motion.div
                    key={issue._id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`border-b rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between my-5 ${selectedItems.includes(issue._id) ? "bg-blue-50" : "bg-white"}`}
                >
                    <div className='flex flex-col md:flex-row'>
                        <input
                            type="checkbox"
                            checked={selectedItems.includes(issue._id)}
                            onChange={() => handleCheckboxChange(issue._id)}
                        />
                        <div className='md:ml-3'>
                        <h3 className="text-xl md:text-left font-semibold text-gray-800">{issue.title}</h3>
                        <p className="text-sm text-gray-600 mt-3">
                            Language: {issue.language}<span className={
                                issue.urgency === "now"
                                    ? "text-red-700 bg-red-100 border border-red-400 px-2 py-0.5 rounded ml-2"
                                    : "text-green-700 bg-green-100 border border-green-400 px-2 py-0.5 rounded ml-2"
                            }>Urgency: {issue.urgency}</span>
                        </p>
                        </div>
                    </div>
                    {issue.solution && <div className="relative group inline-block m-auto mt-3 md:mt-auto">
                        <svg className="w-5 h-5 text-blue-500 cursor-pointer" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M8 2v4"></path><path d="M16 2v4"></path><path d="M4 10h16"></path><path d="M12 14l2 2l4-4"></path><path d="M12 14v4"></path></svg>

                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap 
        bg-gray-800 text-white text-sm px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 
        transition-opacity duration-200">
                            Solution: {issue.solution}
                        </span>
                    </div>}
                    <div>
                        <div>
                            <span>Created On : {new Date(issue.createdAt).toLocaleString()}</span>
                        </div>
                        <div>
                            <span>Updated On : {new Date(issue.createdAt).toLocaleString() === new Date(issue.updatedAt).toLocaleString() ? "Not Updated yet" : new Date(issue.updatedAt).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4 justify-between sm:mt-0">
                        <div className="bg-teal-700 text-white px-4 py-2 rounded-xl hover:bg-teal-800">
                            {issue.isOpen ? "Open" : "closed"}
                        </div>
                        <Link to={`/issue/${issue._id}`} className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">
                            Edit
                        </Link>
                        <button onClick={() => deleteIssue(issue._id)} className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700">delete</button>
                        <Link to={`/dashboard/livesession/${issue._id}`} className="bg-gray-600 hidden md:block text-white px-4 py-2 rounded-xl hover:bg-gray-700">
                            Session
                        </Link>
                    </div>
                </motion.div>
            ))}
            </AnimatePresence>
        </div>)
}


function UsersList({ users, onDelete }) {
    const [selectedItems, setSelectedItems] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState(users.filter((item) => item.username.toLowerCase() !== "admin"));
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const [activeOneWeekAgo, setActiveOneWeekAgo] = useState(filteredUsers.filter((item) => new Date(item.updatedAt) < oneWeekAgo));


const displayItems = React.useMemo(() => {
    const admin = users.filter((item) => item.username === "admin");
  const selected = users.filter((item) => selectedItems.includes(item._id));
  const unselected = users.filter((item) =>item.username.toLowerCase() !== "admin" &&  !selectedItems.includes(item._id));
  return [...admin,...selected, ...unselected];
}, [users, selectedItems]);
    // Toggle single checkbox
    const handleCheckboxChange = (id) => {
        setSelectedItems((prev) =>
            prev.includes(id)
                ? prev.filter((itemId) => itemId !== id)
                : [...prev, id]
        );
    };


    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = filteredUsers.map((item) => item._id);
            setSelectedItems(allIds);
        } else {
            setSelectedItems([]);
        }
        console.log(selectedItems);
    };

    // Delete selected
    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) {
            alert("No items selected!");
            return;
        }

        if (!window.confirm("Are you sure you want to delete selected items?")) {
            return;
        }

        try {
            // Option 1: Multiple DELETE calls (simple)
            await Promise.all(
                selectedItems.map((id) => {
                    API.delete(`/users/${id}`);
                    onDelete(id);
                })
            );
            setSelectedItems([]);
            alert("Selected items deleted successfully");
        } catch (error) {
            console.error(error);
            alert("Error deleting selected items");
        }
    };

    const deleteUser = async (userId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this item?");
        if (!confirmDelete) return;
        try {
            const res = await API.delete(`/users/${userId}`);
            alert(res.data.message || "Deleted successfully");
            onDelete(userId);
            // Update UI after delete
            // setItems(prev => prev.filter(item => item._id !== id));
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Error deleting item");
        }
    };

    if (!users || users.length === 0) return <p className="text-gray-500 text-center">No users present till</p>;
    return (
        <div className="mt-6">
            <h3 className="text-xl font-bold text-blue-600 mb-4">Users</h3>

            <div className="flex items-center mb-2 flex flex-col md:flex-row w-full">
                <div className='w-full text-left md:w-auto'>
                    <input
                        type="checkbox"
                        checked={selectedItems.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={handleSelectAll}
                        className="mr-2"
                    />
                    <span>Select All</span>
                </div>
                <label className="flex items-center gap-2 md:ml-5 w-full md:w-auto text-left">
                    <input
                        type="checkbox"
                        onChange={(e) => {
                            if (e.target.checked) {
                                const inactiveIds = activeOneWeekAgo.map((item) => item._id);
                                setSelectedItems(inactiveIds);
                            } else {
                                setSelectedItems([]);
                            }
                        }}
                    />
                    <span>Select inactive</span>
                </label>

                <button
                    onClick={handleDeleteSelected}
                    className="md:ml-auto bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 w-full md:w-auto"
                >
                    Delete Selected
                </button>
            </div>
            <AnimatePresence>
            {displayItems.map((user) => (
                <motion.div
                    key={user._id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`border-b rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between my-5 ${selectedItems.includes(user._id) ? "bg-blue-50" : "bg-white"}`}
                >
                    <div className='flex flex-col md:flex-row'>
                        {!(user.username === "admin") && <input
                            type="checkbox"
                            checked={selectedItems.includes(user._id)}
                            onChange={() => handleCheckboxChange(user._id)}
                        />}
                        <div className='md:ml-3'>
                            <h3 className="text-xl md:text-left font-semibold text-gray-800">{user.username}</h3>
                            <p className="text-sm text-gray-600 mt-3 flex flex-col md:flex-row">
                                <span><strong>Email: {user.email}</strong></span><span className={
                                    user.isOnline
                                        ? "text-green-700 bg-green-100 border border-green-400 px-2 py-0.5 rounded ml-2 mt-2 md:mt-0"
                                        : "text-red-700 bg-red-100 border border-red-400 px-2 py-0.5 rounded ml-2 mt-2 md:mt-0"
                                }>Online: {user.isOnline ? "Yes" : "No"}</span>
                            </p>
                        </div>
                    </div>
                    <div>
                        <div>
                            <span>Created On : {new Date(user.createdAt).toLocaleString()}</span>
                        </div>
                        <div>
                            <span>Updated On : {new Date(user.createdAt).toLocaleString() === new Date(user.updatedAt).toLocaleString() ? "Not Updated yet" : new Date(user.updatedAt).toLocaleString()}</span>
                        </div>
                    </div>
                    {user.username !== "admin" &&
                        <div className="flex gap-2 mt-4 justify-between sm:mt-0">
                            <Link to={`/user/${user._id}`} className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">
                                Edit
                            </Link>
                            <button onClick={() => deleteUser(user._id)} className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700">delete</button>
                        </div>}
                </motion.div>
            ))}
            </AnimatePresence>
        </div>
    )
}