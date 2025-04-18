// frontend/src/auth.js

import { default as jwtDecode } from "jwt-decode";  // 正确导入 jwtDecode

// Helper 函数：检查 JWT 是否过期
function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp && decoded.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
}

// 登录函数：调用后端 API 进行登录，成功则将 JWT 保存
async function login(email, password) {
  const API_BASE = process.env.REACT_APP_API_BASE_URL || "";
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!response.ok) {
    // 提取错误信息（如果后端有返回）
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.message || "Login failed";
    throw new Error(errorMsg);
  }
  const data = await response.json();
  if (data.token) {
    localStorage.setItem("token", data.token);
  }
  return data;
}

// 登出函数：清除本地保存的 JWT
function logout() {
  localStorage.removeItem("token");
}

// 取得当前保存的 JWT（可能为 null）
function getToken() {
  return localStorage.getItem("token");
}

// 取得当前用户信息（从 JWT 解码），若无效则返回 null
function getUser() {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (e) {
    return null;
  }
}

// 取得 Authorization Header，供需验证的 API 请求使用
function getAuthHeader() {
  const token = getToken();
  return token ? { "Authorization": "Bearer " + token } : {};
}

// 导出 auth 对象，包含登录/登出等方法
const auth = {
  login,
  logout,
  getToken,
  getUser,
  getAuthHeader,
  isTokenExpired
};

export default auth;
