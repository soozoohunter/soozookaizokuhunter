/*************************************************************
 * frontend/src/pages/Home.js
 * - 將原本多餘的「Hunter for Free」按鈕移除
 * - 在 "Secure Your Intellectual Property..." 區塊下方
 *   新增一個「Namecheap 風格」的檔案上傳欄位 + Submit
 *************************************************************/
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);

  // 模擬：使用者在首頁直接選檔 → 按「Hunter for Free」→ 跳到 /protect/step1
  // 您也可以直接在這裡完成上傳, 看您需求
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      alert('請選擇檔案');
      return;
    }
    // 這裡可以先把檔案存起來, 或直接上傳
    // 範例：跳轉到 /protect/step1
    navigate('/protect/step1');
  };

  return (
    <div style={styles.container}>
      {/* 原有敘述: THE WORLD'S ONLY Blockchain-Proven... */}
      <div style={styles.banner}>
        <h1 style={styles.mainTitle}>
          THE WORLD'S ONLY Blockchain-Proven Originality Platform
        </h1>
        <p style={styles.desc}>
          We are a proudly Taiwanese (台灣) 🇹🇼 platform dedicated to safeguarding creators worldwide.
          <br/><br/>
          Are you still risking losing your intellectual property due to inadequate proof of originality?
          Under international copyright law, failing to prove originality means losing your rights entirely—
          regardless of your creativity.<br/><br/>
          <strong>ONLY WE</strong> offer a solution powerful enough to end this nightmare instantly:
          <strong> Blockchain Digital Fingerprint</strong> combined with
          <strong> AI Infringement Detection</strong> and rapid global legal actions.<br/><br/>
          <strong>Proving originality is notoriously challenging — but not anymore.</strong>
          We simplify complex copyright evidence into a single click.
          Connect your accounts, and the blockchain instantly becomes your undeniable proof of originality.
          100% tamper-proof, globally recognized, and admissible in courts everywhere.
        </p>
      </div>

      {/* 新增: "Secure Your Intellectual Property" + 檔案上傳欄位 */}
      <div style={styles.uploadSection}>
        <h2 style={styles.uploadTitle}>
          Secure Your Intellectual Property: Instantly. Precisely. Effortlessly.
        </h2>
        <p style={styles.uploadDesc}>
          捍衛你的智慧財產權，即刻且準確。結合區塊鏈與AI智慧技術，
          24小時全方位偵測與追蹤侵權行為，為你的影音、圖像、文字與商標提供強力法律證據。
          <br/>
          現在就免費體驗上傳，立即生成原創證明！
        </p>

        {/* Namecheap 風格: 一個檔案輸入框 + 按鈕 */}
        <form onSubmit={handleSubmit} style={styles.uploadForm}>
          <input
            type="file"
            onChange={e => setFile(e.target.files[0])}
            style={styles.fileInput}
          />
          <button type="submit" style={styles.uploadBtn}>
            Hunter for Free / 免費試用
          </button>
        </form>
      </div>

      {/* 其他行銷段落 (保留原文或依需求調整) */}
      <div style={styles.bottomSection}>
        <h2 style={styles.bottomTitle}>Welcome to SUZOO IP Guard 🚀</h2>
        <p style={styles.bottomDesc}>
          Every second counts—someone might be stealing your ideas right now!
        </p>

        <details style={styles.legalBlock}>
          <summary style={{ cursor:'pointer', color:'#FF5722', marginBottom:'1rem' }}>
            Understand Why "Proof of Originality" is Critical (點此展開)
          </summary>
          <div style={{ marginTop:'1rem', lineHeight:'1.6', fontSize:'0.95rem' }}>
            <p>
              【繁中】根據台灣與國際著作權法，<strong>著作權保護</strong>與
              <strong>著作權原創證明</strong>至關重要，特別是在無強制登記制度下，創作者必須自行舉證
              <strong>著作權</strong>之原創性與完成時間。無法有效舉證，則在法律訴訟中幾乎必敗無疑。
            </p>
            <p>
              我們的平台提供全球獨一無二的解決方案，以區塊鏈技術創建永久不可篡改之證據，結合強力AI偵測侵權。只需點擊幾下，
              即可完成原創認證與<strong>著作權保護</strong>，讓您在全球法庭上都能取得壓倒性證明效力。
            </p>
            <p style={{ marginTop:'1rem' }}>
              <strong>【EN】</strong>
              Under both Taiwanese and international copyright laws, the burden of proof
              for originality lies with creators—no mandatory registration is required,
              but failure to prove authorship usually results in losing the case.
              We are the ONLY platform that integrates blockchain immutability and
              powerful AI infringement detection.
            </p>
            <p style={{ marginTop:'1rem', color:'#ffd54f', fontWeight:'600' }}>
              Join us now and defend your creative value like never before!
            </p>
          </div>
        </details>

        <p style={styles.extraMarketing}>
          <strong>我們是世界唯一！</strong> 只有我們能將區塊鏈與
          <strong>著作權原創證明</strong>完美結合，並提供即時掃描、
          DMCA強制下架與全球法律行動。別再猶豫，立即行動吧！
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#0a0f17',
    color: '#f5faff',
    minHeight: '100vh',
    paddingBottom: '3rem' // 預留一些底部空間
  },
  banner: {
    border: '3px solid #FF5722',
    borderRadius: '12px',
    margin: '2rem auto',
    maxWidth: '1200px',
    padding: '2rem 3rem',
    background: '#12181f',
    boxShadow: '0 8px 24px rgba(255,87,34,0.4)'
  },
  mainTitle: {
    fontSize: '2.4rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#FF5722',
    textAlign: 'center'
  },
  desc: {
    fontSize: '1.05rem',
    lineHeight: '1.9',
    color: '#c7d2da'
  },

  // 新增的上傳區塊
  uploadSection: {
    margin: '2rem auto',
    maxWidth: '900px',
    backgroundColor: '#161d27',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
    textAlign: 'center'
  },
  uploadTitle: {
    fontSize: '1.8rem',
    color: '#FF5722',
    marginBottom: '1rem',
    fontWeight: '700'
  },
  uploadDesc: {
    fontSize: '1rem',
    color: '#eceff1',
    marginBottom: '1.5rem',
    lineHeight: '1.6'
  },
  uploadForm: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem'
  },
  fileInput: {
    fontSize: '1rem',
    color: '#ffffff',
    backgroundColor: '#2c2c2c',
    border: '1px solid #444',
    borderRadius: '4px',
    padding: '0.5rem'
  },
  uploadBtn: {
    backgroundColor: '#e53935',
    color: '#fff',
    padding: '0.8rem 2rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '25px', 
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },

  // 底部行銷段落
  bottomSection: {
    margin: '2rem auto',
    maxWidth: '1000px',
    padding: '2rem'
  },
  bottomTitle: {
    fontSize: '2rem',
    color: '#FF5722',
    marginBottom: '1rem',
    textAlign: 'center'
  },
  bottomDesc: {
    textAlign: 'center',
    fontSize: '1.1rem',
    color: '#eceff1'
  },
  legalBlock: {
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: '#12181f',
    border: '2px solid #FF5722',
    borderRadius: '8px',
    textAlign: 'left'
  },
  extraMarketing: {
    marginTop: '2rem',
    fontSize: '1.2rem',
    color: '#ffd54f',
    fontWeight: '600',
    textAlign: 'center'
  }
};
