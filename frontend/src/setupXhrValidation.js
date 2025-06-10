export function installXhrOpenValidation() {
  if (typeof XMLHttpRequest === 'undefined') {
    return;
  }

  const proto = XMLHttpRequest.prototype;

  if (proto.open && proto.open.__validated) {
    return;
  }

  const originalOpen = proto.open;

  function validatedOpen(method, url, ...args) {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      const msg =
        `XMLHttpRequest.open called with invalid URL: "${url}". URL must start with http:// or https://.`;
      console.error(msg);
      throw new TypeError(msg);
    }
    return originalOpen.call(this, method, url, ...args);
  }

  validatedOpen.__validated = true;
  proto.open = validatedOpen;
}
