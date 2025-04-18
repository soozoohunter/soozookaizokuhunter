/**
 * frontend/src/auth.js
 *
 * 使用 jwt-decode v4.x 的「具名匯出」方式來解析 JWT。
 * 不動其他 UI 或行銷文字，只提供基本的登入/登出/解析方法。
 */

import { decode as jwtDecode } from 'jwt-decode';

/**
 * 檢查給定的 token 是否已過期。
 * 若 token 無法解析或已過期，回傳 true。
 */
export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    // decoded.exp (單位:秒) 若小於當前時間(毫秒除以1000)，就表示過期
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return true;
    }
    return false;
  } catch (err) {
    console.error('isTokenExpired() decode error:', err);
    return true;
  }
}

/**
 * 呼叫後端 /api/auth/login 進行登入，若成功，將 token 存入 localStorage。
 * @param {string} emailOrUsername - 可放 email 或 userName
 * @param {string} password
 * @returns {Promise<{ token?: string, message?: string }>}
 */
export async function login(emailOrUsername, password) {
  try {
    // 請自行調整後端 API 路徑 (例如 /auth/login 或 /api/auth/login)
    // 若有 .env 中定義 REACT_APP_API_BASE_URL，可改為:
    // const base = process.env.REACT_APP_API_BASE_URL || '';
    // const url = base + '/auth/login';
    const url = '/api/auth/login';

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // 如果後端需要 { email, password }，請依後端需求改 key
        email: emailOrUsername,
        password
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }
    // 若成功且後端回傳 data.token，存入 localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  } catch (err) {
    console.error('login() error:', err);
    throw err;
  }
}

/**
 * 登出：清除 localStorage 中的 token
 */
export function logout() {
  localStorage.removeItem('token');
}

/**
 * 取得當前存在 localStorage 的 JWT。若沒有則回傳 null。
 */
export function getToken() {
  return localStorage.getItem('token') || null;
}

/**
 * 嘗試解碼 JWT，失敗時回傳 null。
 * 成功時回傳解碼後的物件，例如 { userId, exp, iat, ... }。
 */
export function getDecodedUser() {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (err) {
    console.error('getDecodedUser() decode error:', err);
    return null;
  }
}

/**
 * 取得標準的 Authorization Header，用於 fetch 時帶上認證
 * e.g. { Authorization: 'Bearer <token>' }
 */
export function getAuthHeader() {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/**
 * 可選：一併匯出所有方法
 */
const auth = {
  isTokenExpired,
  login,
  logout,
  getToken,
  getDecodedUser,
  getAuthHeader,
};
export default auth;
