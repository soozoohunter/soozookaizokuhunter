/**
 * frontend/src/auth.js
 *
 * 使用 jwt-decode v4.x 的「具名匯出」方式解析 JWT。
 * 注意：若專案其他檔案也寫了 `import jwtDecode from 'jwt-decode'`，
 * 一樣要修改成 `import { decode as jwtDecode } from 'jwt-decode';`
 */

import { decode as jwtDecode } from 'jwt-decode';

/**
 * 檢查 token 是否過期
 * @param {string} token
 * @returns {boolean} 過期或無法解析時返回 true
 */
export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    // decoded.exp 是 Unix 時間（秒），若 exp < (現在毫秒/1000) => 過期
    return decoded.exp ? Date.now() >= decoded.exp * 1000 : false;
  } catch (err) {
    console.error('[isTokenExpired] decode error:', err);
    return true; 
  }
}

/**
 * 呼叫後端 /api/auth/login 進行登入，若成功回傳 token，並存 localStorage
 * @param {string} emailOrUsername 後端若要求 email，則傳 email；若可 username，則傳 username
 * @param {string} password
 * @returns {Promise<{ token?: string, message?: string }>}
 */
export async function login(emailOrUsername, password) {
  try {
    // 視專案而定，可能是 /auth/login 或 /api/auth/login
    const url = '/api/auth/login';

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailOrUsername, password })
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  } catch (err) {
    console.error('[login] error:', err);
    throw err;
  }
}

/** 登出，移除 localStorage 裡的 token */
export function logout() {
  localStorage.removeItem('token');
}

/** 取得當前 token（若無則回傳 null） */
export function getToken() {
  return localStorage.getItem('token') || null;
}

/**
 * 解碼 token => 回傳解碼後的物件
 * @returns {object|null}
 */
export function getDecodedUser() {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (err) {
    console.error('[getDecodedUser] decode error:', err);
    return null;
  }
}

/** 用於 fetch 時帶上 Authorization 頭 */
export function getAuthHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** 也可整合所有匯出 */
const auth = {
  isTokenExpired,
  login,
  logout,
  getToken,
  getDecodedUser,
  getAuthHeader
};
export default auth;
