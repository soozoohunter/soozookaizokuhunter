import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        if (res.status === 409) {
          setError('Email is already registered.');
        } else {
          setError('Registration failed. Please try again.');
        }
      } else {
        // Registration successful
        alert('Registration successful! Please log in.');
        navigate('/login');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed due to a network or server error.');
    }
  };

  return (
    <div className="register-page">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email: <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        </div>
        <div>
          <label>Password: <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        </div>
        <div>
          <label>Confirm Password: <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></label>
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}

export default RegisterPage;
