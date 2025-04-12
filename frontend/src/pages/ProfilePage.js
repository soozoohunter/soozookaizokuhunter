import React, { useState, useEffect } from 'react';

function ProfilePage({ token }) {
  const [profileData, setProfileData] = useState(null);
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
        setProfileData(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data.');
      }
    };
    fetchProfile();
  }, [token]);

  return (
    <div className="profile-page">
      <h2>Your Profile</h2>
      {error && <p className="error">{error}</p>}
      {profileData ? (
        <div>
          {profileData.name && <p>Name: {profileData.name}</p>}
          {profileData.username && !profileData.name && <p>Username: {profileData.username}</p>}
          {profileData.email && <p>Email: {profileData.email}</p>}
          {/* Add more profile fields as needed */}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default ProfilePage;
