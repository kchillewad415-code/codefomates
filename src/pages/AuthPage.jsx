
import React, { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import PrivacyPolicy from "./PrivacyPolicy";

export default function AuthPage({ onLoginUser }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", isOnline: false });
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
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [privacyMsg, setPrivacyMsg]=useState(false);
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


  useEffect(()=>{
    const user = localStorage.getItem("loginProfile");

    if(user){
      navigate("/");
    }
    
  },[]);



  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const newUser = async () => {
    const checkUser = users && users.filter(item => item.username === form.username);
    if (checkUser && checkUser.length === 0) {
      setErrormsg(false);
      const checkEmail = users && users.filter(item => item.email === form.email);
      if (checkEmail && checkEmail.length > 0) {
        setDuplicateEmail(true);
        return;
      }
      setDuplicateEmail(false);
      try {
        await API.post("/users", form);
      } catch (err) {
        console.error("Error submitting issue:", err);
      }
      setForm({ username: "", email: "", password: "" });
      window.location.reload();
    } else {
      setErrormsg(true);
    }
  };
  const updateUser = async (id, updateData) => {
    try {
      await API.put(`/users/${id}`, updateData);
    } catch (err) {
      console.log(err);
    }
  };
  const checkLogin = async () => {
    const loginUser = users && users.filter(item => item.email === form.email);
    if (loginUser && loginUser.length > 0) {
      try {
        await API.post("/login", form)
          .then(res => res.data)
          .then(data => {
            const updateLoginUser = {
              ...loginUser[0],
              isOnline: true,
            };
            updateUser(loginUser[0]._id, updateLoginUser);
            setForm({ username: "", email: "", password: "" });
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
  // Password strength validation
  const validatePassword = (pwd) => {
    const minLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const [passwordError, setPasswordError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignup) {
      if (!validatePassword(form.password)) {
        setPasswordError("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
        return;
      }
      setPasswordError("");
      if(!privacyChecked){
        setPrivacyMsg(true);
        return;
      }
      setPrivacyMsg(false);
      newUser(form);

    } else {
      setErrormsg(false);
      setWrongpassword(false);
      setNouser(false);
      checkLogin();
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotStatus("Sending...");
    try {
      await API.post("https://codeformates-backend.vercel.app/forgot-password", { email: forgotEmail });
      setForgotStatus("Password reset link sent to your email.");
    } catch (err) {
      setForgotStatus("Failed to send reset link. Check your email.");
    }
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
                {isSignup ? "Sign Up" : "Log In"}
              </h2>
              {wrongpassword ? <span className="text-red-600">wrong email or password</span> : null}
              {nouser ? <span className="text-red-600">No user found check again or signup</span> : null}
              {!showForgot ? (
                <>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignup && (
                      <>
                        <input
                          type="text"
                          name="username"
                          value={form.username}
                          onChange={handleChange}
                          placeholder="Username"
                          className="w-full px-4 py-2 border rounded-xl"
                          required
                        />
                        {errormsg ? <span className="text-red-600">username already Exist try another</span> : null}
                      </>
                    )}
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Email"
                      className="w-full px-4 py-2 border rounded-xl"
                      required
                    />
                    {duplicateEmail ? <span className="text-red-600">Email already in use. Please use a different email.</span> : null}
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
                    {isSignup && (
                      <div className="text-xs text-red-600 mt-1">{passwordError}</div>
                    )}
                    {isSignup && (
                      <ul className="text-xs text-gray-500 mt-1 list-disc pl-5">
                        <li className="text-red-600">Password must be at least 8 characters</li>
                        <li className="text-red-600">Include uppercase, lowercase, number, and special character</li>
                      </ul>
                    )}
                    {isSignup && <div className="flex flex-row items-center w-full"><input
                        type="checkbox"
                        checked={privacyChecked}
                        onChange={()=>setPrivacyChecked(!privacyChecked)}
                        className="mr-2"
                    />
                    <span className="text-xs flex flex-row">Privacy Policy Accepted <a className="ml-1 text-blue-600" target="_blank" href="https://www.freeprivacypolicy.com/live/aab18550-5c2c-4da3-9273-7a35837bd8b8">privacy policy</a>.</span></div>
                    }
                    {privacyMsg && <span className="text-red-600">Please click on Privacy Policy box to proceed the signup.</span>}
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700"
                    >
                      {isSignup ? "Create Account" : "Log In"}
                    </button>
                  </form>
                  <div className="text-right mt-2">
                    <button
                      className="text-blue-600 text-sm hover:underline"
                      onClick={() => setShowForgot(true)}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <input
                    type="email"
                    name="forgotEmail"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-2 border rounded-xl"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700"
                  >
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    className="w-full bg-gray-300 text-gray-700 py-2 rounded-xl mt-2"
                    onClick={() => { setShowForgot(false); setForgotStatus(""); }}
                  >
                    Back to Login
                  </button>
                  {forgotStatus && <div className="mt-2 text-blue-600 text-center">{forgotStatus}</div>}
                </form>
              )}
              <p className="text-sm text-center mt-4 text-gray-600">
                {isSignup ? "Already have an account?" : "Don't have an account?"} {" "}
                <button
                  onClick={() => { setIsSignup(!isSignup); setErrormsg(false); setWrongpassword(false); setNouser(false); setForgotStatus(""); setShowForgot(false); setDuplicateEmail(false); }}
                  className="text-blue-600 hover:underline"
                >
                  {isSignup ? "Log In" : "Sign Up"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
