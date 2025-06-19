// frontend/src/auth.js
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'token';

function login(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

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

function getAuthHeader() {
  const token = getToken();
  if (token) {
    return { Authorization: 'Bearer ' + token };
  }
  return {};
}

function isLoggedIn() {
  const token = getToken();
  if (!token) return false;
  const decoded = decodeToken(token);
  if (!decoded) {
    logout();
    return false;
  }
  // 檢查 exp 時間是否已過期
  if (decoded.exp && Date.now() >= decoded.exp * 1000) {
    logout();
    return false;
  }
  return true;
}

export default {
  login,
  logout,
  getToken,
  decodeToken,
  getAuthHeader,
  isLoggedIn
};
