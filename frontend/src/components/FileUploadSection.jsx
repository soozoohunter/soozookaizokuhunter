import React, { useState } from 'react';
import './FileUploadSection.css';

const FileUploadSection = () => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  return (
    <div className="file-upload-section">
      <h2>選擇檔案 (圖片或影片)</h2>
      <div className="file-input-container">
        <label className="file-input-label">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="file-input"
          />
          <span className="file-input-button">選擇檔案</span>
          <span className="file-name">
            {selectedFile ? selectedFile.name : '尚未選取檔案'}
          </span>
        </label>
      </div>

      <div className="form-group">
        <label htmlFor="title">作品標題</label>
        <input
          type="text"
          id="title"
          placeholder="例如：2025 台北夜景"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="name">姓名</label>
        <input type="text" id="name" className="form-input" />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input type="email" id="email" className="form-input" />
      </div>

      <button className="submit-button">上傳並產生證明</button>
    </div>
  );
};

export default FileUploadSection;
