export function installXhrOpenValidation() {
  if (typeof XMLHttpRequest === 'undefined') {
    return;
  }

  const originalOpen = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      throw new Error(
        `XMLHttpRequest.open: invalid URL "${url}". Expected URL starting with http:// or https://.`
      );
    }
    return originalOpen.call(this, method, url, ...args);
  };
}
