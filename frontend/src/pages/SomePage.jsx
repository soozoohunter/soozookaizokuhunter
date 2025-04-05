import React from 'react';
import logo from '../assets/logo.png'; // 請確認該路徑正確，圖片放在 frontend/src/assets/ 資料夾中

function SomePage() {
  return (
    <div style={{ padding: '20px' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <img 
          src={logo} 
          alt="Logo" 
          style={{ width: '100px', marginRight: '20px' }} 
        />
        <h1>Welcome to SomePage</h1>
      </header>
      <main>
        <p>
          這是 SomePage 頁面，您可以在這裡展示您的應用介紹、功能說明或其他內容。
        </p>
        <p>
          請根據實際需求調整此頁面的內容與佈局，這僅為一個示範範例。
        </p>
      </main>
    </div>
  );
}

export default SomePage;