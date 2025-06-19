let accessToken = null;

export function setAccessToken(token) {
    accessToken = token;
}

export function getAccessToken() {
    return accessToken;
}

export function clearTokens() {
    accessToken = null;
}

export default { setAccessToken, getAccessToken, clearTokens };
