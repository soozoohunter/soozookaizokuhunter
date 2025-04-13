import React, { useState } from 'react';

export default function RegisterPage() {
  // STEP 狀態: 1=Email階段, 2=驗證碼階段, 3=輸入密碼+其他欄位
  const [step, setStep] = useState(1);

  // Step1: Email
  const [email, setEmail] = useState('');

  // Step2: 驗證碼
  const [code, setCode] = useState('');

  // Step3: 兩次密碼 + 其餘欄位
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [userName, setUserName] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [shopee, setShopee] = useState('');
  const [ruten, setRuten] = useState('');
  const [amazon, setAmazon] = useState('');
  const [taobao, setTaobao] = useState('');

  // 錯誤 & 成功訊息
  const [errMsg, setErrMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');

  // STEP1: 寄送驗證碼
  const handleSendCode = async () => {
    setErrMsg('');
    setOkMsg('');
    if (!email) {
      setErrMsg('請填寫 Email');
      return;
    }
    try {
      const resp = await fetch('/auth/sendCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await resp.json();
      if (resp.ok) {
        setOkMsg('驗證碼已寄出，請查收信箱');
        setStep(2);
      } else {
        setErrMsg(data.error || '寄送驗證碼失敗');
      }
    } catch (e) {
      setErrMsg('發生錯誤:' + e.message);
    }
  };

  // STEP2: 驗證碼檢查
  const handleCheckCode = async () => {
    setErrMsg('');
    setOkMsg('');
    if (!code) {
      setErrMsg('請輸入驗證碼');
      return;
    }
    try {
      const resp = await fetch('/auth/checkCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await resp.json();
      if (resp.ok) {
        setOkMsg('驗證碼正確，請繼續完成註冊');
        setStep(3);
      } else {
        setErrMsg(data.error || '驗證失敗');
      }
    } catch (e) {
      setErrMsg('發生錯誤:' + e.message);
    }
  };

  // STEP3: 送出最終註冊
  const handleFinalRegister = async () => {
    setErrMsg('');
    setOkMsg('');
    if (!password1 || !password2 || !userName) {
      setErrMsg('請輸入必填欄位(兩次密碼、UserName)');
      return;
    }
    try {
      const resp = await fetch('/auth/finalRegister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password1,
          password2,
          userName,
          facebook,
          instagram,
          youtube,
          tiktok,
          shopee,
          ruten,
          amazon,
          taobao
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        setOkMsg('註冊成功，請至登入頁登入');
      } else {
        setErrMsg(data.error || '註冊失敗');
      }
    } catch (e) {
      setErrMsg('發生錯誤:' + e.message);
    }
  };

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>會員註冊</h2>

      {step===1 && (
        <div style={styles.formArea}>
          <label style={styles.label}>
            登入帳號 <span style={{ color:'orange' }}>(必填)</span>
          </label>
          <input
            style={styles.input}
            type="text" // 避免 iOS pattern
            placeholder="請輸入您的 Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
          {errMsg && <p style={styles.errMsg}>{errMsg}</p>}
          {okMsg && <p style={styles.okMsg}>{okMsg}</p>}
          <button style={styles.btn} onClick={handleSendCode}>
            寄送驗證碼
          </button>
        </div>
      )}

      {step===2 && (
        <div style={styles.formArea}>
          <label style={styles.label}>輸入寄到 <strong>{email}</strong> 的驗證碼</label>
          <input
            style={styles.input}
            type="text"
            placeholder="6 碼驗證碼"
            value={code}
            onChange={e => setCode(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
          {errMsg && <p style={styles.errMsg}>{errMsg}</p>}
          {okMsg && <p style={styles.okMsg}>{okMsg}</p>}
          <button style={styles.btn} onClick={handleCheckCode}>
            檢查驗證碼
          </button>
        </div>
      )}

      {step===3 && (
        <div style={styles.formArea}>
          <label style={styles.label}>
            Password <span style={{ color:'orange' }}>(必填)</span>
          </label>
          <input
            style={styles.input}
            type="password"
            placeholder="輸入密碼"
            value={password1}
            onChange={e => setPassword1(e.target.value)}
          />

          <label style={styles.label}>
            Confirm Password <span style={{ color:'orange' }}>(必填)</span>
          </label>
          <input
            style={styles.input}
            type="password"
            placeholder="再次輸入密碼"
            value={password2}
            onChange={e => setPassword2(e.target.value)}
          />

          <label style={styles.label}>
            UserName <span style={{ color:'orange' }}>(必填)</span>
          </label>
          <input
            style={styles.input}
            type="text"
            placeholder="您的暱稱 / 用戶名"
            value={userName}
            onChange={e => setUserName(e.target.value)}
          />

          {/* 其他欄位 */}
          <div style={{ marginTop:'0.6rem', color:'orange' }}>可選填社群 / 電商</div>
          <label style={styles.label}>Facebook</label>
          <input
            style={styles.input}
            type="text"
            value={facebook}
            onChange={e => setFacebook(e.target.value)}
          />
          <label style={styles.label}>Instagram</label>
          <input
            style={styles.input}
            type="text"
            value={instagram}
            onChange={e => setInstagram(e.target.value)}
          />
          <label style={styles.label}>YouTube</label>
          <input
            style={styles.input}
            type="text"
            value={youtube}
            onChange={e => setYoutube(e.target.value)}
          />
          <label style={styles.label}>TikTok</label>
          <input
            style={styles.input}
            type="text"
            value={tiktok}
            onChange={e => setTiktok(e.target.value)}
          />
          <label style={styles.label}>蝦皮 / Shopee</label>
          <input
            style={styles.input}
            type="text"
            value={shopee}
            onChange={e => setShopee(e.target.value)}
          />
          <label style={styles.label}>露天 / Ruten</label>
          <input
            style={styles.input}
            type="text"
            value={ruten}
            onChange={e => setRuten(e.target.value)}
          />
          <label style={styles.label}>Amazon</label>
          <input
            style={styles.input}
            type="text"
            value={amazon}
            onChange={e => setAmazon(e.target.value)}
          />
          <label style={styles.label}>淘寶 / Taobao</label>
          <input
            style={styles.input}
            type="text"
            value={taobao}
            onChange={e => setTaobao(e.target.value)}
          />

          {errMsg && <p style={styles.errMsg}>{errMsg}</p>}
          {okMsg && <p style={styles.okMsg}>{okMsg}</p>}
          <button style={styles.btn} onClick={handleFinalRegister}>
            提交註冊
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    maxWidth: '480px',
    margin: '2rem auto',
    border: '2px solid orange', // 橘色框框
    borderRadius: '8px',
    padding: '1.5rem',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#fff'
  },
  title: {
    textAlign: 'center',
    color: 'orange',
    marginBottom: '1rem',
    fontSize: '1.6rem'
  },
  formArea: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    marginTop: '0.8rem',
    marginBottom: '4px',
    color: 'orange'
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #555',
    borderRadius: '4px',
    marginBottom: '0.4rem'
  },
  btn: {
    backgroundColor: 'orange',
    color: '#000',
    border: 'none',
    padding: '0.6rem 1.2rem',
    fontWeight: 'bold',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '0.6rem'
  },
  errMsg: {
    color: 'red'
  },
  okMsg: {
    color: 'lime'
  }
};
