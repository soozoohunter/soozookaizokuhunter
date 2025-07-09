// express/worker.js (Debug "Hello World" Version)
const http = require('http');
const logger = require('./utils/logger'); // 假設 logger 模組是正常的

const PORT = 3001;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Worker is alive!\n');
});

server.listen(PORT, () => {
  // 這個日誌是唯一我們期望看到的
  logger.info(`[Worker-Debug] Dummy worker started successfully on port ${PORT}. It does nothing but stay alive.`);
});

logger.info('[Worker-Debug] Starting dummy worker...');
