// frontend/src/auth.js

// 使用 require 引入 jwt-decode，避免默认导出报错
const jwtDecode = require("jwt-decode");

// Helper: 检查 JWT 是否过期
export function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp && decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// 登录：调用后端，拿到 token 后存入 localStorage
export async function login(email, password) {
  const API_BASE = process.env.REACT_APP_API_BASE_URL || "";
  const resp = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || "Login failed");
  }
  const data = await resp.json();
  if (data.token) {
    localStorage.setItem("token", data.token);
  }
  return data;
}

// 登出：清除 token
export function logout() {
  localStorage.removeItem("token");
}

// 获取当前 token
export function getToken() {
  return localStorage.getItem("token");
}

// 从 token 解出用户信息
export function getUser() {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

// 构造 Authorization header
export function getAuthHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 默认导出一个合集（可选）
const auth = { login, logout, getToken, getUser, getAuthHeader, isTokenExpired };
export default auth;
