// Utility functions for validating URLs
const HTTP_URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
function isValidHttpUrl(str) {
  if (!str) return false;
  const trimmed = str.trim();
  if (!HTTP_URL_RE.test(trimmed)) return false;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}
module.exports = { isValidHttpUrl };
