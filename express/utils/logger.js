const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

// 建立 logs 目錄 (如果不存在)，防止寫入檔案時出錯
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// --- 自訂日誌格式 ---
const logFormat = format.printf(({ level, message, timestamp, stack }) => {
  // 如果有錯誤堆疊 (stack)，就印出堆疊；否則只印出訊息
  // 同時處理 message 是物件的情況，將其轉為 JSON 字串
  const msg = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
  return `${timestamp} ${level}: ${stack || msg}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.colorize(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }), // 告訴 winston 解析並印出錯誤堆疊
    logFormat
  ),
  transports: [
    // --- 控制台輸出 ---
    // 將所有日誌都顯示在 console 中，方便 `docker compose logs` 查看
    new transports.Console()
  ],
  // --- 未捕捉的例外處理 ---
  // 當發生未預期的錯誤時，將其記錄到檔案中，以便事後分析
  exceptionHandlers: [
    new transports.File({ filename: path.join(logDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(logDir, 'rejections.log') })
  ],
  exitOnError: false, // 發生未捕捉的例外時，不要結束 Node.js 程序
});

module.exports = logger;
