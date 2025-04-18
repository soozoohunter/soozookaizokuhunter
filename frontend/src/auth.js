// frontend/src/auth.js

// 以具名匯入方式拿到 'decode' 函數，並重新命名為 jwtDecode
import { decode as jwtDecode } from 'jwt-decode';

/**
 * 檢查 JWT 是否過期
 * @param {string} token 
 * @returns {boolean} true 表示已過期或解析失敗
 */
export function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token);
    // 若有 exp 欄位，檢查是否已超時
    return decoded.exp && (decoded.exp * 1000 < Date.now());
  } catch (e) {
    // 無法解析 token
    return true;
  }
}

// 登入函數：呼叫後端 API 進行登入
export async function login(email, password) {
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

// 登出函數：清除本地保存的 JWT
export function logout() {
  localStorage.removeItem("token");
}

// 取得目前保存的 JWT（可能為 null）
export function getToken() {
  return localStorage.getItem("token");
}

// 取得當前使用者資訊（從 JWT 解碼），若無效則返回 null
export function getUser() {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (e) {
    return null;
  }
}

// 取得 Authorization Header，供需驗證的 API 請求使用
export function getAuthHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 若需要可再匯出一個預設
export default {
  login,
  logout,
  getToken,
  getUser,
  getAuthHeader,
  isTokenExpired
};
