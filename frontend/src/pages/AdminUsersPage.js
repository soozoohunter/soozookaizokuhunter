import React, { useEffect, useState } from 'react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/users', { headers: { Authorization: localStorage.getItem('adminToken') ? `Bearer ${localStorage.getItem('adminToken')}` : '' } })
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(setUsers)
      .catch(err => { setError('Failed to load users'); console.error(err); });
  }, []);

  return (
    <div>
      <h2>Admin Users</h2>
      {error && <div>{error}</div>}
      <ul>
        {users.map(u => <li key={u.id}>{u.email}</li>)}
      </ul>
    </div>
  );
}
