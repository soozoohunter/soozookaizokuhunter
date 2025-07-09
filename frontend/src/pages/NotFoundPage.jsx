import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>404 - Page Not Found</h1>
      <p style={{ marginBottom: '1.5rem' }}>The page you are looking for does not exist.</p>
      <Link to="/" style={{ color: '#f97316' }}>Return Home</Link>
    </div>
  );
}
