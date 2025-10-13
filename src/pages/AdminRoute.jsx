import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import API from "../api";


const AdminRoute = ({ children }) => {
  const [isAllowed, setIsAllowed] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('loginProfile'));
    const checkAccess = async () => {
      try {
        const res = await API.post('/api/admin-access', { username: user.username });
        setIsAllowed(res.data.allowed);
        console.log("data",res.data, res);
      } catch (err) {
        setIsAllowed(false);
      }
    };
    checkAccess();
  }, []);

  if (isAllowed === null) return <p>Loading...</p>;
  if (!isAllowed) return <Navigate to="/" replace />;

  return children;
};

export default AdminRoute;
