import React, { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';

const BulkUploader = ({ onClose }) => {
    const [files, setFiles] = useState([]);
    const [uploadStatus, setUploadStatus] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const { token } = useContext(AuthContext);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);
        setUploadStatus({});
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            alert('請先選擇檔案');
            return;
        }
        setIsUploading(true);

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await fetch('/api/protect/batch-protect', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            const newStatus = {};
            data.results.forEach(result => {
                newStatus[result.filename] = {
                    status: result.status,
                    message: result.reason || '成功',
                };
            });
            setUploadStatus(newStatus);

        } catch (error) {
            console.error('Upload failed:', error);
            alert('上傳失敗，請檢查網路連線或稍後再試。');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', backgroundColor: '#374151', borderRadius: '8px' }}>
            <h4>選擇多個檔案進行保護</h4>
            <input type="file" multiple onChange={handleFileChange} />
            
            <button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? '上傳中...' : `上傳 ${files.length} 個檔案`}
            </button>
            <button onClick={onClose} style={{ marginLeft: '1rem' }}>關閉</button>

            <div style={{ marginTop: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                {files.map(file => (
                    <div key={file.name}>
                        <span>{file.name}</span>
                        {uploadStatus[file.name] && (
                            <span style={{ marginLeft: '1rem', color: uploadStatus[file.name].status === 'success' ? 'lightgreen' : 'pink' }}>
                                - {uploadStatus[file.name].status}: {uploadStatus[file.name].message}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BulkUploader;
