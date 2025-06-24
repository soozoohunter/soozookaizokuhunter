const levels = ['log', 'info', 'warn', 'error', 'debug'];

function logWithLevel(level, ...args) {
  const timestamp = new Date().toISOString();
  if (levels.includes(level)) {
    console[level](`[${timestamp}] [${level.toUpperCase()}]`, ...args);
  } else {
    console.log(`[${timestamp}] [LOG]`, ...args);
  }
}

module.exports = {
  log: (...args) => logWithLevel('log', ...args),
  info: (...args) => logWithLevel('info', ...args),
  warn: (...args) => logWithLevel('warn', ...args),
  error: (...args) => logWithLevel('error', ...args),
  debug: (...args) => logWithLevel('debug', ...args),
};
