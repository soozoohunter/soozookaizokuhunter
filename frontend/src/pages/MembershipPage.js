import React, { useState, useEffect } from 'react';

function MembershipPage({ token }) {
  const [membershipData, setMembershipData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMembership = async () => {
      try {
        const res = await fetch('/api/membership', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error(`Error ${res.status}`);
        }
        const data = await res.json();
        setMembershipData(data);
      } catch (err) {
        console.error('Error fetching membership:', err);
        setError('Failed to load membership data.');
      }
    };
    fetchMembership();
  }, [token]);

  return (
    <div className="membership-page">
      <h2>Membership</h2>
      {error && <p className="error">{error}</p>}
      {membershipData ? (
        <div>
          <h3>Your Membership Details:</h3>
          <ul>
            {Object.entries(membershipData).map(([key, value]) => (
              <li key={key}><strong>{key}:</strong> {String(value)}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default MembershipPage;
