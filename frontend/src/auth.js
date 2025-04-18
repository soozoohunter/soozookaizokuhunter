// frontend/src/auth.js

// 从 jwt-decode 里用 named import 拿到 decode，再重命名为 jwtDecode
import { decode as jwtDecode } from 'jwt-decode';

/**
 * 检查 JWT 是否过期
 * @param {string} token
 * @returns {boolean} 过期或解析失败时返回 true
 */
export function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp && decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * 登录：调用后端 /api/auth/login，拿到 token 并存入 localStorage
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} 包含 token 的响应数据
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

/** 获取当前的 JWT（或 null） */
export function getToken() {
  return localStorage.getItem('token');
}

/** 解码 JWT 并返回 payload（或 null） */
export function getUser() {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

/** 构造 Authorization header */
export function getAuthHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** 可选：一次性导出所有方法 */
const auth = {
  isTokenExpired,
  login,
  logout,
  getToken,
  getUser,
  getAuthHeader,
};
export default auth;
