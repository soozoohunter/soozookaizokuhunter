// frontend/src/auth.js

// 以 named import 拿到 decode，再重新命名為 jwtDecode
import { decode as jwtDecode } from 'jwt-decode';

/**
 * 檢查 JWT 是否過期
 * @param {string} token 
 * @returns {boolean} true 表示已過期或解析失敗
 */
export function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp && (decoded.exp * 1000 < Date.now());
  } catch (e) {
    return true;
  }
}

/**
 * 登入函數：呼叫後端 API 進行登入
 * @param {string} email 使用者 Email
 * @param {string} password 使用者密碼
 * @returns {Promise<object>} 後端返回的 JSON 資料 (包含 token)
 */
export async function login(email, password) {
  // 若您有自定義環境變數，可放在 process.env.REACT_APP_API_BASE_URL
  const API_BASE = process.env.REACT_APP_API_BASE_URL || "";
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Login failed");
  }

  const data = await response.json();
  if (data.token) {
    localStorage.setItem("token", data.token);
  }
  return data;
}

/**
 * 登出函數：清除本地保存的 JWT
 */
export function logout() {
  localStorage.removeItem("token");
}

/**
 * 取得目前保存的 JWT
 * @returns {string|null}
 */
export function getToken() {
  return localStorage.getItem("token");
}

/**
 * 取得當前使用者資訊（從 JWT 解碼）
 * @returns {object|null}
 */
export function getUser() {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (e) {
    return null;
  }
}

/**
 * 取得 Authorization Header，供需驗證的 API 請求使用
 * @returns {object} { Authorization: 'Bearer xxx' } 或 {}
 */
export function getAuthHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 可選：匯出所有方法的集合
 */
const auth = {
  login,
  logout,
  getToken,
  getUser,
  getAuthHeader,
  isTokenExpired
};
export default auth;
