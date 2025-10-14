import React, { useEffect, useState } from "react";
import API from "../api";
import { Navigate, replace } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const [accessGranted, setAccessGranted] = useState(null);
  const [phrase, setPhrase] = useState("");


  const handleAccess = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('loginProfile'));

      const res = await API.post("/api/admin-access", { phrase, username: user.username });
      if (res.data.allowed) {
        setAccessGranted(true);
        localStorage.setItem("adminAccessGranted",true);
      } else {
        alert("Incorrect key. Access denied.");
        setAccessGranted(false);
      }
    } catch {
      alert("Error verifying access.");
      setAccessGranted(false);
    }
  };

  useEffect(()=>{
    console.log("called");
    const access = JSON.parse(localStorage.getItem("adminAccessGranted"));
console.log("access",access);
    if(access){
      console.log("if called");
      setAccessGranted(true);
    }
  });

  if (accessGranted === null) {
    return (
      <div style={popupStyles.overlay}>
        <form onSubmit={handleAccess} style={popupStyles.container}>
          <h3>Enter Access Key 🔒</h3>
          <input
            type="password"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="Enter secret phrase"
            style={popupStyles.input}
          />
          <button type="submit" style={popupStyles.button}>
            Verify
          </button>
        </form>
      </div>
    );
  }

  if (!accessGranted) return <Navigate to="/" replace />;
  return children;
};

// Simple inline styling for popup
const popupStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  container: {
    background: "#fff",
    padding: "2rem",
    borderRadius: "1rem",
    boxShadow: "0 0 10px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  input: {
    padding: "0.5rem",
    marginTop: "1rem",
    width: "100%",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  button: {
    marginTop: "1rem",
    padding: "0.5rem 1rem",
    border: "none",
    background: "#007bff",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default AdminRoute;
