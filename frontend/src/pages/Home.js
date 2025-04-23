// frontend/src/pages/Home.js
import React, { useState } from 'react';

export default function Home() {
  // 若您想把檔案先存在 state / localStorage，帶到下一步，就可使用 useState:
  const [selectedFile, setSelectedFile] = useState(null);

  // 處理檔案改變 -> optional: 預先儲存 base64 / localStorage 以便 ProtectStep1 不必再上傳
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // ***範例: 把檔案先讀成 base64 存 localStorage***
      const reader = new FileReader();
      reader.onload = function(evt) {
        if (evt.target.readyState === FileReader.DONE) {
          localStorage.setItem('uploadedFileBase64', evt.target.result);
          localStorage.setItem('uploadedFileName', file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProveOriginalNow = () => {
    // 前往 Step1（實作上，Step1 將不再要求重新上傳，而是顯示預覽）
    window.location.href = '/protect/step1';
  };

  return (
    <div style={styles.container}>

      {/*********************************************************************
       * (A) 置頂：上傳欄位 & 「立即生成原創證明」按鈕
       *********************************************************************/}
      <div style={styles.topUploadSection}>
        <h2 style={styles.topUploadTitle}>
          {/* 雙語文案 */}
          Prove Your Original Authorship Now / 立即生成原創證明
        </h2>

        <div style={styles.uploadBar}>
          {/* 上傳檔案：以簡易文字引導 */}
          <label htmlFor="fileUpload" style={styles.uploadLabel}>
            1) Upload Short Video to Generate Dynamic Fingerprint  
            <br/>
            &nbsp;&nbsp;Upload Image File to Generate Static Fingerprint
          </label>
          <input
            id="fileUpload"
            type="file"
            style={styles.fileInput}
            onChange={handleFileChange}
          />
          <button
            style={styles.uploadButton}
            onClick={handleProveOriginalNow}
          >
            {/* 取代舊的 Hunter for Free */}
            Generate Original Proof Now
            <br/>
            立即生成原創證明
          </button>
        </div>
      </div>

      {/*********************************************************************
       * (B) Hero banner
       *********************************************************************/}
      <div style={styles.banner}>
        <h1 style={styles.mainTitle}>
          THE WORLD'S ONLY Blockchain & AI-Powered Originality Proof Platform
        </h1>
        <p style={styles.desc}>
          We are proudly Taiwanese (台灣🇹🇼), and the only platform combining blockchain and AI
          to prove true authorship worldwide.<br/><br/>

          Are you still struggling to prove your <strong>original creation</strong>?
          Under international copyright law, failing to establish originality means losing your rights entirely.
          <br/><br/>
          <strong>ONLY WE</strong> solve this once-impossible challenge:
          <strong> Blockchain Digital Fingerprint + AI Infringement Detection</strong>,
          backed by rapid global legal actions.
          <br/><br/>
          <strong>Proving originality is notoriously difficult — but not with us.</strong>
          We turn complex copyright evidence into a single step. 100% tamper-proof, globally recognized,
          and admissible in courts everywhere.
        </p>
      </div>

      {/*********************************************************************
       * (C) Secure Section
       *********************************************************************/}
      <div style={styles.secureSection}>
        <h2 style={styles.secureTitle}>
          Secure Your Intellectual Property: Instantly. Precisely. Effortlessly.
        </h2>
        <p style={styles.secureDesc}>
          結合區塊鏈與 AI 智能技術，24 小時隨時偵測侵權行為。  
          為您的影音、圖像、文字與商標提供強力法律武器。  
          <br/>
          Now you can enjoy a seamless, globally recognized proof of authorship—anytime, anywhere!
        </p>
      </div>

      {/*********************************************************************
       * (D) Welcome / marketing & 『展開區塊』 
       *********************************************************************/}
      <div style={styles.addonSection}>
        <h2 style={styles.welcomeTitle}>
          Welcome to SUZOO IP Guard 🚀
        </h2>
        <p style={styles.addonDesc}>
          Every second counts—someone might be stealing your ideas right now!
        </p>

        <details style={styles.legalBlock}>
          <summary style={styles.legalSummary}>
            Understand Why "Proof of Originality" Matters (點此展開)
          </summary>
          <div style={styles.legalText}>
            {/* ====== 在這裡放您給我的著作權法理&原創性長文，並帶出行銷語 ====== */}
            <p>
              <strong>EN:</strong>  
              Copyright law protects the “expression” of your ideas, not the ideas themselves.
              Traditional systems only detect textual plagiarism; they can’t confirm true “originality.”
              That’s why we integrate blockchain timestamps and AI-driven fingerprinting to ensure
              undeniable proof of authorship. <em>Only with us</em> can you finally solve the age-old question:
              <strong>“How do I prove I am the original creator?”</strong><br/><br/>
              <strong>ZH:</strong>  
              著作權法保護的是「表達」，而非「概念」。傳統系統僅能比對文字抄襲，卻無法真的證明
              「原創性」。我們透過區塊鏈時間戳 + AI 指紋技術，讓您徹底解決
              「我怎麼證明自己才是原著作人？」的世界難題。全世界只有我們能做到！
            </p>
            <p>
              <strong>《核心重點》</strong><br/>
              {`- `}智慧財產權是各國法律為了保障人類精神活動成果而設的保護機制；  
              {`- `}著作權法中強調「原創」必須是「獨立創作」且「創作性」達一定程度；  
              {`- `}一般比對系統只能檢測「字面相似度」，並不保證您能證明「我才是原創」。  
            </p>
            <p style={styles.legalEmph}>
              Let us handle that final gap—once you upload, we record an immutable blockchain fingerprint,
              proving in any court that “this exact expression is yours.”<br/>
              (上傳後，我們替您完成不可篡改的區塊鏈指紋，一旦遇到法律爭議，就能證明「此作品正是您原創」。)
            </p>
          </div>
        </details>

        <p style={styles.extraMarketing}>
          <strong>We are truly the world’s only solution!</strong><br/>
          No one else can integrate blockchain & AI to permanently seal your originality.
        </p>
      </div>

      {/*********************************************************************
       * (E) Footer - Company Info (英文 ONLY)
       *********************************************************************/}
      <div style={styles.companyInfo}>
        <hr style={styles.divider} />
        <p style={styles.companyText}>
          <strong>Epic Global International Co., Ltd.</strong><br/><br/>
          <strong>Headquarters:</strong> 1F, No.5, Lane 40, Taishun St, Da’an Dist, Taipei City<br/>
          <strong>Banqiao Office:</strong> No.3, Lane 36, Ln.153, Sec.2, Sanmin Rd, Banqiao, New Taipei City<br/>
          <strong>Contact:</strong> +886 900-296-168 (GM Zack Yao)
        </p>
      </div>
    </div>
  );
}

// 樣式
const styles = {
  container: {
    backgroundColor: '#0a0f17',
    color: '#f5faff',
    minHeight: '100vh',
    padding: '4rem',
    fontFamily: 'Inter, sans-serif'
  },

  // 上方上傳/按鈕
  topUploadSection: {
    textAlign: 'center',
    marginBottom: '3rem'
  },
  topUploadTitle: {
    fontSize: '1.8rem',
    color: '#FF5722',
    marginBottom: '1rem',
    fontWeight: 600
  },
  uploadBar: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem'
  },
  uploadLabel: {
    fontSize: '0.95rem',
    color: '#ffcc80',
    marginBottom: '0.3rem'
  },
  fileInput: {
    padding: '0.4rem',
    backgroundColor: '#fff',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  uploadButton: {
    backgroundColor: '#FF5722',
    color: '#fff',
    border: 'none',
    padding: '0.6rem 1.4rem',
    borderRadius: '4px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '1rem'
  },

  // Hero
  banner: {
    border: '3px solid #FF5722',
    borderRadius: '12px',
    padding: '3rem',
    background: '#12181f',
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(255,87,34,0.4)',
    marginBottom: '3rem'
  },
  mainTitle: {
    fontSize: '2.6rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#FF5722'
  },
  desc: {
    fontSize: '1.05rem',
    lineHeight: '1.8',
    color: '#c7d2da'
  },

  // Secure
  secureSection: {
    textAlign: 'center',
    marginBottom: '3rem'
  },
  secureTitle: {
    fontSize: '1.8rem',
    color: '#FF5722',
    marginBottom: '1rem',
    fontWeight: 600
  },
  secureDesc: {
    fontSize: '1rem',
    color: '#eceff1',
    marginBottom: '1.5rem',
    lineHeight: '1.6'
  },

  // Addon
  addonSection: {
    backgroundColor: '#161d27',
    padding: '2.5rem',
    borderRadius: '10px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
    textAlign: 'center',
    marginBottom: '3rem'
  },
  welcomeTitle: {
    fontSize: '2rem',
    color: '#FF5722',
    marginBottom: '1rem'
  },
  addonDesc: {
    fontSize: '1.1rem',
    color: '#eceff1',
    marginBottom: '1.5rem'
  },
  legalBlock: {
    textAlign: 'left',
    display: 'inline-block',
    width: '100%',
    maxWidth: '900px',
    margin: '0 auto 1.5rem',
    background: '#12181f',
    border: '2px solid #FF5722',
    borderRadius: '8px',
    padding: '1rem'
  },
  legalSummary: {
    cursor: 'pointer',
    color: '#FF5722',
    fontWeight: 500
  },
  legalText: {
    marginTop: '1rem',
    lineHeight: 1.6,
    fontSize: '0.95rem',
    color: '#c7d2da'
  },
  legalEmph: {
    marginTop: '1rem',
    color: '#ffd54f',
    fontWeight: 600
  },
  extraMarketing: {
    fontSize: '1.2rem',
    color: '#ffd54f',
    fontWeight: 600
  },

  // Footer company
  companyInfo: {
    textAlign: 'center',
    marginTop: '4rem'
  },
  divider: {
    width: '60%',
    margin: '1.5rem auto',
    borderColor: '#FF5722'
  },
  companyText: {
    fontSize: '0.95rem',
    color: '#b0bec5',
    lineHeight: 1.6
  }
};
