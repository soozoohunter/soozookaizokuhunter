// frontend/src/auth.js

// 正确的默认导入 jwt-decode（不要用命名导入，也不要用大括号）
import jwtDecode from "jwt-decode";

// Helper 函数：检查 JWT 是否过期
export function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp && decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// 登录函数：调用后端 API 进行登录，成功则将 JWT 保存
export async function login(email, password) {
  const API_BASE = process.env.REACT_APP_API_BASE_URL || "";
  const resp = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!resp.ok) {
    const errJson = await resp.json().catch(() => ({}));
    throw new Error(errJson.message || "Login failed");
  }
  const { token, ...rest } = await resp.json();
  if (token) {
    localStorage.setItem("token", token);
  }
  return { token, ...rest };
}

// 登出：清除本地 JWT
export function logout() {
  localStorage.removeItem("token");
}

// 获取当前存储的 JWT
export function getToken() {
  return localStorage.getItem("token");
}

// 从 JWT 解出用户信息
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
