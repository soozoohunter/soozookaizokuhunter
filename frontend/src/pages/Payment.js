// frontend/src/pages/Payment.js

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function Payment() {
  const [searchParams] = useSearchParams();
  const item = searchParams.get('item') || 'certificate';
  const price = searchParams.get('price') || '99';

  const [showBank, setShowBank] = useState(false);
  const [showProofForm, setShowProofForm] = useState(false);

  // 資料欄位
  const [realName, setRealName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  // Step1：顯示銀行帳號
  const handlePay = () => {
    setShowBank(true);
  };

  // Step2：切換顯示「上傳憑證表單」
  const handleShowProof = () => {
    setShowProofForm(true);
  };

  // Step3：上傳表單
  const handleSubmit = async(e) => {
    e.preventDefault();
    setMessage('');

    if(!file || !realName.trim() || !email.trim()) {
      return setMessage('請至少填寫「姓名、Email」並選擇檔案');
    }

    try {
      // 將資料送往後端 (Express / FastAPI)
      const formData = new FormData();
      formData.append('item', item);
      formData.append('price', price);
      formData.append('realName', realName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('proofFile', file);

      const resp = await fetch('/api/payment/proof', {
        method: 'POST',
        body: formData
      });

      if(!resp.ok) {
        throw new Error('上傳失敗');
      }
      const data = await resp.json();
      // 假設後端回傳 { success:true, msg:'已收到憑證，請等待審核' }
      if(data.success) {
        setMessage(`上傳成功：${data.msg}`);
      } else {
        setMessage(`上傳失敗：${data.msg || 'Server error'}`);
      }
    } catch(err) {
      console.error(err);
      setMessage(`上傳失敗：${err.message}`);
    }
  };

  return (
    <div style={{ color:'#fff', padding:'2rem', textAlign:'center' }}>
      <h2>Payment</h2>
      <p>Item: {item}</p>
      <p>Price: NT${price}</p>

      {/* Step1：Confirm & Pay */}
      {!showBank ? (
        <button
          onClick={handlePay}
          style={styles.btn}
        >
          Confirm & Pay
        </button>
      ) : (
        <div style={{ marginTop:'2rem', color:'#ff6f00', fontWeight:'bold' }}>
          <p>請匯款至以下帳號：</p>
          <p>
            遠東國際商業銀行 (代號 805)<br/>
            帳號：00200400371797
          </p>
          <p style={{ color:'#fff', marginTop:'1rem', fontSize:'0.9rem' }}>
            匯款後請記下末五碼並聯繫我們 (Email / Phone)。 <br/>
            或在下方直接上傳匯款憑證截圖，以便加速開通服務。
          </p>

          {/* Step2：上傳截圖按鈕 or 直接展開表單 */}
          {!showProofForm ? (
            <button
              onClick={handleShowProof}
              style={{ ...styles.btn, marginTop:'1rem' }}
            >
              上傳匯款憑證
            </button>
          ) : (
            <ProofForm
              realName={realName}
              setRealName={setRealName}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              file={file}
              setFile={setFile}
              message={message}
              setMessage={setMessage}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      )}
    </div>
  );
}

/** 上傳匯款證明的表單 */
function ProofForm({
  realName, setRealName,
  email, setEmail,
  phone, setPhone,
  file, setFile,
  message, setMessage,
  onSubmit
}) {
  return (
    <form onSubmit={onSubmit} style={styles.formContainer}>
      <h3 style={{ color:'#ffd700', marginBottom:'1rem' }}>上傳匯款憑證</h3>
      {message && <p style={{ color:'lime', marginBottom:'0.5rem' }}>{message}</p>}

      <div style={styles.formGroup}>
        <label>姓名 (必填)</label>
        <input
          style={styles.input}
          value={realName}
          onChange={e => setRealName(e.target.value)}
        />
      </div>

      <div style={styles.formGroup}>
        <label>Email (必填)</label>
        <input
          type="email"
          style={styles.input}
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>

      <div style={styles.formGroup}>
        <label>電話 (可選)</label>
        <input
          style={styles.input}
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
      </div>

      <div style={styles.formGroup}>
        <label>截圖檔案 (必填)</label>
        <input
          type="file"
          style={{ marginTop:'0.5rem' }}
          onChange={e => setFile(e.target.files[0] || null)}
        />
      </div>

      <button type="submit" style={{ ...styles.btn, marginTop:'1rem' }}>
        上傳
      </button>
    </form>
  );
}

// Style
const styles = {
  btn: {
    marginTop:'1rem',
    backgroundColor:'#ff6f00',
    color:'#fff',
    border:'none',
    borderRadius:'4px',
    padding:'0.75rem 1.5rem',
    cursor:'pointer'
  },
  formContainer: {
    marginTop:'1rem',
    backgroundColor:'#222',
    padding:'1rem',
    borderRadius:'6px',
    textAlign:'left'
  },
  formGroup: {
    marginBottom:'1rem'
  },
  input: {
    display:'block',
    width:'100%',
    marginTop:'0.3rem',
    padding:'0.5rem'
  }
};
