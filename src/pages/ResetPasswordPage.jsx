import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  // Password strength validation
  const validatePassword = (pwd) => {
    const minLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
      return;
    }
    setPasswordError("");
    if (password !== confirm) {
      setStatus("Passwords do not match.");
      return;
    }
    setStatus("Resetting password...");
    try {
      await API.post(`/reset-password/${token}`, { password });
      setStatus("Password reset successful. You can now log in.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setStatus("Failed to reset password. Token may be invalid or expired.");
    }
  };

  return (
    <div className="bg-gray-100 p-4" style={{ minHeight: 'calc(100vh - 300px)' }}>
      <div className="flex items-center justify-center">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-4 text-blue-600">Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="New Password"
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
          {passwordError && (
            <div className="text-xs text-red-600 mt-1">{passwordError}</div>
          )}
          <ul className="text-xs text-gray-500 mt-1 list-disc pl-5">
            <li>Password must be at least 8 characters</li>
            <li>Include uppercase, lowercase, number, and special character</li>
          </ul>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Confirm New Password"
              className="w-full px-4 py-2 border rounded-xl"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:underline"
              onClick={() => setShowConfirm((prev) => !prev)}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700"
          >
            Reset Password
          </button>
        </form>
        {status && <div className="mt-4 text-center text-blue-600">{status}</div>}
      </div>
      </div>
    </div>
  );
}
