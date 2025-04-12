import React, { useState } from 'react';

function UploadPage({ token }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setError('');
    if (!file) {
      setError('Please choose a file to upload.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (!res.ok) {
        setError(`Upload failed with status ${res.status}.`);
      } else {
        // Try to parse response
        let resultText = '';
        try {
          const data = await res.json();
          resultText = JSON.stringify(data);
        } catch {
          resultText = await res.text();
        }
        setStatus(resultText || 'Upload successful!');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed due to a network or server error.');
    }
  };

  return (
    <div className="upload-page">
      <h2>Upload</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        </div>
        {error && <p className="error">{error}</p>}
        {status && <p className="status">{status}</p>}
        <button type="submit">Upload File</button>
      </form>
    </div>
  );
}

export default UploadPage;
