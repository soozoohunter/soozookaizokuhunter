// frontend/src/auth.js

// 從 jwt-decode 裡面用 named import 取出 jwtDecode
import { jwtDecode } from 'jwt-decode';

/**
 * 檢查 JWT 是否過期
 * @param {string} token 
 * @returns {boolean} 過期或解析失敗回傳 true
 */
export function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp && decoded.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
}

/**
 * 登入：呼叫後端 /api/auth/login，拿到 token 後存入 localStorage
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>} 後端回傳 JSON（包含 token）
 */
export async function login(email, password) {
  const API_BASE = process.env.REACT_APP_API_BASE_URL || '';
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Login failed');
  }
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  return data;
}

/** 登出：清除 localStorage 中的 token */
export function logout() {
  localStorage.removeItem('token');
}

/** 取得目前的 JWT（或 null） */
export function getToken() {
  return localStorage.getItem('token');
}

/** 解碼 JWT，回傳 payload 物件（或 null） */
export function getUser() {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (e) {
    return null;
  }
}

/** 取得帶 Bearer 的 Authorization header */
export function getAuthHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** （可選）一次 export 所有方法 */
const auth = {
  isTokenExpired,
  login,
  logout,
  getToken,
  getUser,
  getAuthHeader,
};

export default auth;
