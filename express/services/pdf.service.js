// express/services/pdf.service.js (Final Resolved Version)
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { User, File } = require('../models');

// --- 目錄設定 ---
// ensure path is resolved relative to /app
const UPLOAD_BASE_DIR = path.resolve(__dirname, '..', 'uploads');
const CERT_DIR = path.join(UPLOAD_BASE_DIR, 'certificates');

// --- 啟動時檢查並建立目錄 ---
if (!fs.existsSync(CERT_DIR)) {
    fs.mkdirSync(CERT_DIR, { recursive: true });
}

/**
 * 生成原創著作權證明 PDF
 * @param {object} data - 包含 fileId, user, file 的物件
 * @returns {Promise<string>} - PDF 檔案的路徑
 */
async function generateCertificatePDF(data) {
    const { fileId } = data;
    logger.info(`[PDF Service] Starting certificate generation for File ID: ${fileId}`);
    try {
        const file = data.file || await File.findByPk(fileId);
        const user = data.user || await User.findByPk(file.user_id);
        if (!file || !user) {
            throw new Error(`File or User not found for File ID: ${fileId}`);
        }

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const fileName = `certificate_${fileId}.pdf`;
        const filePath = path.join(CERT_DIR, fileName);
        const writeStream = fs.createWriteStream(filePath);
        
        doc.pipe(writeStream);

        // --- PDF 內容 ---
        doc.fontSize(25).text('原創著作權證明書 (Certificate of Copyright)', { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(14).text(`茲證明以下數位作品，其相關權利歸屬下列著作權人所有：`);
        doc.moveDown();

        doc.font('Helvetica-Bold').text('著作權人資訊 (Copyright Holder Information):');
        doc.font('Helvetica').text(`姓名 (Name): ${user.name}`);
        doc.text(`電子郵件 (Email): ${user.email}`);
        doc.text(`電話 (Phone): ${user.phone || 'N/A'}`);
        doc.moveDown();

        doc.font('Helvetica-Bold').text('作品資訊 (Work Information):');
        doc.font('Helvetica').text(`作品標題 (Title): ${file.title || 'Untitled'}`);
        doc.text(`原始檔名 (Original Filename): ${file.filename}`);
        doc.text(`存證時間 (Timestamp): ${file.createdAt.toISOString()}`);
        doc.moveDown();

        doc.font('Helvetica-Bold').text('數位存證指紋 (Digital Fingerprints):');
        doc.font('Helvetica').text(`SHA256: ${file.fingerprint}`, { oblique: true });
        doc.text(`IPFS CID: ${file.ipfs_hash}`, { oblique: true });
        doc.text(`區塊鏈交易雜湊 (TxHash): ${file.tx_hash}`, { oblique: true });
        doc.moveDown(3);

        doc.fontSize(10).text('此證明由 SooZoo Kaizoku Hunter 系統基於區塊鏈與 IPFS 技術自動生成，用以記錄作品於特定時間點的存在性與歸屬。', { align: 'center' });

        doc.end();

        // 等待檔案寫入完成
        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
        
        logger.info(`[PDF Service] Certificate successfully generated at: ${filePath}`);
        
        // 將證書路徑存回資料庫
        await file.update({ certificate_url: `/uploads/certificates/${fileName}` });
        
        return filePath;

    } catch (error) {
        logger.error(`[PDF Service] Failed to generate certificate for File ID: ${fileId}`, error);
        throw error;
    }
}

/**
 * 生成包含匹配結果的掃描報告 PDF
 * @param {object} data - 包含 file, suspiciousLinks, matchedImages 的物件
 * @param {string} reportPath - 報告儲存的完整路徑
 * @returns {Promise<void>}
 */
async function generateScanPDFWithMatches(data, reportPath) {
    logger.info(`[PDF Service] Generating scan report for File ID: ${data.file.id}`);
    const { file, suspiciousLinks, matchedImages } = data;
    try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const writeStream = fs.createWriteStream(reportPath);
        doc.pipe(writeStream);
        
        doc.fontSize(20).text(`侵權掃描報告 (Infringement Scan Report)`, { align: 'center' });
        doc.fontSize(12).text(`報告生成時間: ${new Date().toISOString()}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(14).font('Helvetica-Bold').text('原始檔案資訊:');
        doc.font('Helvetica').text(`檔案ID: ${file.id}`);
        doc.text(`檔名: ${file.filename}`);
        doc.text(`SHA256 指紋: ${file.fingerprint}`);
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').text('網路可疑連結 (Suspicious Links):');
        if (suspiciousLinks?.length > 0) {
            suspiciousLinks.slice(0, 30).forEach(link => { // 最多顯示30條
                doc.fillColor('blue').text(link, { link, underline: true }).moveDown(0.5);
            });
        } else {
            doc.fillColor('black').text('未發現可疑的外部連結。');
        }
        doc.moveDown();

        doc.addPage().fontSize(14).font('Helvetica-Bold').text('內部比對相似圖片 (Internal Similar Images):');
        if (matchedImages?.length > 0) {
             matchedImages.forEach(match => {
                doc.fillColor('black').text(`- 檔案ID: ${match.id}, 相似度: ${(match.distance * 100).toFixed(2)}%`).moveDown(0.5);
             });
        } else {
            doc.fillColor('black').text('未在內部資料庫中發現相似圖片。');
        }
        
        doc.end();

        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
        logger.info(`[PDF Service] Scan report successfully generated for File ID: ${file.id}`);
    } catch(error) {
        logger.error(`[PDF Service] Failed to generate scan report for File ID: ${file.id}`, error);
        throw error;
    }
}

// 匯出所有需要的函式
module.exports = {
    generateCertificatePDF,
    generateScanPDFWithMatches,
};