// auth.js - JWT authentication helper module
import jwtDecode from 'jwt-decode';

const TOKEN_KEY = 'token';

// Save JWT token (e.g., on successful login)
function login(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

// Clear JWT token (e.g., on logout)
function logout() {
    localStorage.removeItem(TOKEN_KEY);
}

// Retrieve the stored JWT token
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

// Decode the JWT token to an object (returns null if invalid or missing)
function decodeToken(token = null) {
    const jwt = token || getToken();
    if (!jwt) return null;
    try {
        return jwtDecode(jwt);
    } catch (e) {
        console.error('Failed to decode token', e);
        return null;
    }
}

// Get authorization header for HTTP requests (includes Bearer token if available)
function getAuthHeader() {
    const token = getToken();
    if (token) {
        return { Authorization: 'Bearer ' + token };
    }
    return {};
}

// Check if user is logged in (token exists and not expired)
function isLoggedIn() {
    const token = getToken();
    if (!token) return false;
    const decoded = decodeToken(token);
    if (!decoded) {
        logout();
        return false;
    }
    // If token has an expiration time (exp), ensure it is still valid
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        logout();
        return false;
    }
    return true;
}

// Export all auth functions as default
export default {
    login,
    logout,
    getToken,
    decodeToken,
    getAuthHeader,
    isLoggedIn
};
