import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [socialAccount, setSocialAccount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      // TODO: Call the registration API with { userName, email, password, role, socialAccount }
      // For example:
      // await AuthService.register({ userName, email, password, role, socialAccount });
      // On success, navigate to login or another page:
      setLoading(false);
      navigate('/login');
    } catch (err) {
      setLoading(false);
      // Capture error message from API or use a generic message
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-container" style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#FFD700',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h2 style={{
        color: '#F8E114',
        marginBottom: '20px',
        textAlign: 'center',
        fontSize: '2em',
        fontWeight: 'bold'
      }}>
        Register
      </h2>
      {error && <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
      <form onSubmit={handleRegister} style={{ width: '90%', maxWidth: '400px', padding: '20px', border: '1px solid #FFA500', borderRadius: '8px', boxShadow: '0 0 8px rgba(255,165,0,0.5)', backgroundColor: '#000' }}>
        <input
          type="text"
          placeholder="Username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          style={{
            backgroundColor: '#000',
            border: '1px solid #FFA500',
            borderRadius: '4px',
            color: '#FFD700',
            padding: '10px',
            marginBottom: '10px',
            width: '100%',
            boxSizing: 'border-box',
            boxShadow: 'inset 0 0 5px rgba(255,165,0,0.5)'
          }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            backgroundColor: '#000',
            border: '1px solid #FFA500',
            borderRadius: '4px',
            color: '#FFD700',
            padding: '10px',
            marginBottom: '10px',
            width: '100%',
            boxSizing: 'border-box',
            boxShadow: 'inset 0 0 5px rgba(255,165,0,0.5)'
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            backgroundColor: '#000',
            border: '1px solid #FFA500',
            borderRadius: '4px',
            color: '#FFD700',
            padding: '10px',
            marginBottom: '10px',
            width: '100%',
            boxSizing: 'border-box',
            boxShadow: 'inset 0 0 5px rgba(255,165,0,0.5)'
          }}
        />
        <input
          type="text"
          placeholder="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{
            backgroundColor: '#000',
            border: '1px solid #FFA500',
            borderRadius: '4px',
            color: '#FFD700',
            padding: '10px',
            marginBottom: '10px',
            width: '100%',
            boxSizing: 'border-box',
            boxShadow: 'inset 0 0 5px rgba(255,165,0,0.5)'
          }}
        />
        <input
          type="text"
          placeholder="Social Account"
          value={socialAccount}
          onChange={(e) => setSocialAccount(e.target.value)}
          style={{
            backgroundColor: '#000',
            border: '1px solid #FFA500',
            borderRadius: '4px',
            color: '#FFD700',
            padding: '10px',
            marginBottom: '20px',
            width: '100%',
            boxSizing: 'border-box',
            boxShadow: 'inset 0 0 5px rgba(255,165,0,0.5)'
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: '#000',
            border: '1px solid #FFA500',
            borderRadius: '4px',
            color: '#F8E114',
            padding: '10px',
            width: '100%',
            fontSize: '1em',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
        <div style={{ marginTop: '15px', textAlign: 'center', color: '#FFD700' }}>
          Already have an account? <Link to="/login" style={{ color: '#F8E114', textDecoration: 'none' }}>Login</Link>
        </div>
      </form>
      <style>{`
        .auth-container input,
        .auth-container select,
        .auth-container button {
          transition: all 0.3s;
        }
        .auth-container input:hover,
        .auth-container select:hover {
          border-color: #FFD700;
        }
        .auth-container input:focus,
        .auth-container select:focus {
          outline: none;
          border-color: #FFD700;
          box-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
        }
        .auth-container button:hover {
          background-color: #FFA500;
          color: #000;
        }
        .auth-container button:active {
          background-color: #cc8400;
        }
        .auth-container a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

export default Register;
