
import React, { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function AdminAccess({ onLoginUser }) {
    const [isSignup, setIsSignup] = useState(false);
    const [form, setForm] = useState({ email: "", password: ""});
    const [errormsg, setErrormsg] = useState(false);
    const [wrongpassword, setWrongpassword] = useState(false);
    const [nouser, setNouser] = useState(false);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotStatus, setForgotStatus] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [duplicateEmail, setDuplicateEmail] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            API.get("/users")
                .then(res => {
                    setUsers(res.data);
                    setLoading(false);
                })
                .catch(err => {
                    setLoading(false);
                    console.log(err);
                });
        };
        fetchUsers();
    }, []);


    useEffect(() => {
        const user = localStorage.getItem("loginProfile");

        if (user) {
            navigate("/");
        }

    }, []);
  const updateUser = async (id, updateData) => {
    try {
      await API.put(`/users/${id}`, updateData);
    } catch (err) {
      console.log(err);
    }
  };


    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const checkLogin = async () => {
        const loginUser = users && users.filter(item => item.email === form.email);
        console.log("admin data",loginUser, form);
        if (loginUser && loginUser.length > 0) {
                    console.log("admin data inside if",loginUser,form);

            try {
                                    console.log("admin data inside try",loginUser, form);

                await API.post("/login", form)
                    .then(res => res.data)
                    .then(data => {
                        console.log("message",data);
                        const updateLoginUser = {
                            ...loginUser[0],
                            isOnline: true,
                        };
                        updateUser(loginUser[0]._id, updateLoginUser);
                        setForm({ email: "", password: "" });
                        onLoginUser(updateLoginUser);
                        localStorage.setItem('loginProfile', JSON.stringify(updateLoginUser));
                        navigate("/profile/editProfile");
                    });
            } catch (err) {
                setWrongpassword(true);
            }
        } else {
            setNouser(true);
        }
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        setErrormsg(false);
        setWrongpassword(false);
        setNouser(false);
        checkLogin();
    };
    return (
        <div className="bg-gray-100 p-4" style={{ minHeight: 'calc(100vh - 300px)' }}>
            <div className="flex items-center justify-center">
                <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40">
                            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                            <span className="mt-2 text-blue-600">Loading users...</span>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-center mb-4 text-blue-600">
                                Admin Login
                            </h2>
                            {wrongpassword ? <span className="text-red-600">wrong email or password</span> : null}
                            {nouser ? <span className="text-red-600">No user found check again or signup</span> : null}
                            <>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <input
                                        type="text"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="email"
                                        className="w-full px-4 py-2 border rounded-xl"
                                        required
                                    />
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            placeholder="Password"
                                            className="w-full px-4 py-2 border rounded-xl"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:underline"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                        >
                                            {showPassword ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700"
                                    >
                                        Log In
                                    </button>
                                </form>
                            </>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
