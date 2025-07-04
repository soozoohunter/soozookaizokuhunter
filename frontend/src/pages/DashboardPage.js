import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';

function DashboardPage() {
  const { token } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error(`Error ${res.status}`);
        }
        const data = await res.json();
        setUserData(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load user data.');
      }
    };
    fetchProfile();
  }, [token]);

  return (
    <div className="dashboard-page">
      <h2>Dashboard</h2>
      {error && <p className="error">{error}</p>}
      {userData ? (
        <p>Welcome, {userData.name || userData.username || userData.email || 'User'}!</p>
      ) : (
        <p>Loading...</p>
      )}
      {/* You can display more dashboard info here */}
    </div>
  );
}

export default DashboardPage;
