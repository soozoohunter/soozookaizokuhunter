// frontend/src/pages/Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>

      {/* ======== FreeTrial (Step1) Button 放在最上方 ======== */}
      <div style={styles.topAction}>
        <button
          onClick={() => navigate('/protect/step1')}
          style={styles.freeTrialBtn}
        >
          Start Free Trial → Protect Your Work (Step1)
        </button>
      </div>

      {/* ===== Banner / Hero 區域 ===== */}
      <div style={styles.banner}>

        <h1 style={styles.shortTitle}>
          BLOCKCHAIN + AI = FLAWLESS COPYRIGHT PROTECTION
        </h1>
        <p style={styles.subTitle}>ONE CLICK TO PROVE YOUR ORIGINALITY.</p>

        <p style={styles.desc}>
          We are a proudly Taiwanese (台灣) 🇹🇼 platform, but also registered in 
          <strong> Seychelles</strong> (塞席爾為聯合國成員國)
          – ensuring our certificates carry <strong>global legal validity</strong>.
          <br /><br />
          Under modern copyright law, <strong>Originality</strong> is the key.
          Failing to prove your creation time and independence often means losing everything in court —
          even if you truly created it first.
          <br /><br />
          <strong>ONLY WE</strong> combine unstoppable <strong>Blockchain Fingerprinting</strong>
          with advanced <strong>AI Infringement Detection</strong> and global legal solutions, 
          recognized under the <strong>Berne Convention</strong> and <strong>WTO/TRIPS</strong>.
          <br /><br />
          <strong>No more guesswork, no more hidden copying:</strong>
          once you're on our chain, your authorship is unassailable,
          recognized by courts worldwide, and protected from any unauthorized use.
        </p>

        {/* (底下公司資訊) */}
        <div style={styles.twoCols}>
          {/* === 左邊: 公司介紹 === */}
          <div style={styles.leftCol}>
            <h2 style={{ color: '#ffca28', fontSize: '1.3rem', marginBottom: '1rem' }}>
              Our Global Company
            </h2>
            <p style={styles.companyIntro}>
              <strong>🇹🇼Epic Global International Co., Ltd.</strong> <br />
              凱盾全球國際股份有限公司 (Seychelles-registered) <br /><br />

              Operating Headquarters: Taipei, Taiwan.<br />
              Global Incorporation: Republic of Seychelles (UN member).<br /><br />

              <strong>Contact:</strong> +886 900-296-168 (GM Zack Yao)
            </p>
          </div>

          {/* === 右邊: 法規專欄 === */}
          <div style={styles.rightCol}>

            {/* (A) 服務 & 國際法介紹 */}
            <details style={styles.detailsBox}>
              <summary style={styles.summaryStyle}>
                Our Unique Global Service (Bern Convention, TRIPS, WTO)
              </summary>
              <div style={styles.detailInner}>
                <p>
                  Our service integrates <strong>blockchain registration</strong> 
                  with <strong>AI scanning</strong> for potential infringement worldwide.
                  We are recognized under the <em>Berne Convention</em> for the Protection 
                  of Literary and Artistic Works, and <em>TRIPS</em> (Agreement on 
                  Trade-Related Aspects of Intellectual Property Rights) under the WTO framework.
                </p>
                <p>
                  Because Seychelles is a member of the United Nations since 1976, 
                  our corporate registration there ensures <strong>global enforceability</strong>
                  of all our certificates. No matter where infringers hide, 
                  you have the powerful legal grounds to claim your rights.
                </p>
                <p style={{ marginTop: '1rem' }}>
                  If you ever face disputes abroad, 
                  our certificate is recognized internationally, 
                  covering major jurisdictions that adhere to <strong>WTO</strong> treaties. 
                  This means unstoppable proof of your original authorship.
                </p>
              </div>
            </details>

            {/* (B) 台灣著作權法 + WTO 加入後衝擊  + 摘要 */}
            <details style={styles.detailsBox}>
              <summary style={styles.summaryStyle}>
                Taiwan Copyright Act &amp; WTO/TRIPS (點此展開)
              </summary>
              <div style={styles.detailInner}>
                <p>
                  <strong>中華民國著作權法 (Taiwan)</strong> 已多次修正，以符合 
                  <em>WTO/TRIPS</em> 規範。自動保護原創作品，不需註冊即可享有著作權。
                  加入世界貿易組織後，對外國著作也更擴大回溯保護。
                </p>
                <p>
                  <em>TRIPS</em> 要求會員體遵守 
                  <em>Berne Convention</em> 基本精神，對著作財產權施以「著作人終身+50年」保護期間，
                  並落實國民待遇(MFN 原則)，意即他國作品在台灣也享同等保護。
                </p>
                <p style={{ marginTop: '1rem' }}>
                  依照法學者章忠信先生(刊於「律師雜誌」)，WTO 的相關規範要求
                  我國對外國著作回溯保護，使用者應該「授權利用」「付費使用」，
                  不再能將外國作品視為公共領域任意使用。這對智慧財產的尊重
                  與國際接軌十分重要。
                </p>
                <p style={{ marginTop: '1rem', color: '#ffd54f', fontWeight: '600' }}>
                  我們的區塊鏈＋AI存證，即符合此趨勢，在世界各地皆能有效遏止侵權！
                </p>
              </div>
            </details>

          </div>
        </div>
      </div>

      {/* ======= 行銷文案 Supplement 區域 ======= */}
      <div style={styles.addonSection}>
        <h2 style={styles.welcomeTitle}>Welcome to SUZOO IP Guard 🚀</h2>
        <p style={styles.addonDesc}>
          Every second counts—someone might be stealing your ideas right now! <br />
          Protect your Copyright &amp; Infringement claims with unstoppable evidence.
        </p>

        <details style={styles.legalBlock}>
          <summary style={{ cursor: 'pointer', color: '#FF5722', marginBottom: '1rem' }}>
            Understand Why "Originality" Matters (點此展開)
          </summary>
          <div style={{ marginTop: '1rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
            <p>
              【繁中】根據台灣與國際著作權法，「原創性」是判斷是否享有著作權保護的關鍵。
              只要是 <strong>獨立完成</strong> 的創作，即使與他人作品雷同，也可能受保護；
              但若不能證明獨立完成，將面臨抄襲、侵權的風險。
            </p>
            <p>
              不論是攝影、美術、文本、程式碼，只要在完成之際無法舉證原創，
              <strong>法院就可能認定著作權不成立</strong>。
              這也是為什麼我們強調
              <strong>區塊鏈+AI雙重保障</strong>的重要性——
              一次上鏈，終身保護，AI 即時比對潛在侵權。
            </p>
            <p style={{ marginTop: '1rem' }}>
              <strong>【EN】</strong>
              Copyright law revolves around proving independent creation.
              If you can't show that your work is truly original, you risk losing all claims.
              Our system locks your proof onto the blockchain at the moment of creation,
              ensuring no one can challenge your authorship or time of completion.
            </p>
            <p style={{ marginTop: '1rem', color: '#ffd54f', fontWeight: '600' }}>
              Join us and never lose a copyright dispute again!
            </p>
          </div>
        </details>

        <p style={styles.extraMarketing}>
          <strong>We are the world’s only!</strong> 
          Combining “Blockchain Evidence” with “AI Infringement Detection” 
          solves the “proof of originality” problem once and for all. Protect now!
        </p>
      </div>

      {/* ======== Pricing Button 放在最底部 ======== */}
      <div style={styles.bottomAction}>
        <button
          onClick={() => navigate('/pricing')}
          style={styles.pricingBtn}
        >
          View Pricing Plans
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#0a0f17',
    color: '#f5faff',
    minHeight: '100vh',
    padding: '4rem',
    fontFamily: 'Inter, sans-serif',
  },
  topAction: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  freeTrialBtn: {
    backgroundColor: '#00e676',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    padding: '0.9rem 2rem',
    cursor: 'pointer',
    fontSize: '1.05rem',
    fontWeight: 'bold',
    transition: 'transform 0.2s',
  },
  banner: {
    border: '3px solid #FF5722',
    borderRadius: '12px',
    padding: '3rem',
    background: '#12181f',
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(255,87,34,0.4)',
  },
  shortTitle: {
    fontSize: '1.9rem',
    fontWeight: 'bold',
    color: '#FF5722',
    textTransform: 'uppercase',
    marginBottom: '0.5rem',
  },
  subTitle: {
    fontSize: '1.1rem',
    textTransform: 'uppercase',
    color: '#ffd700',
    marginBottom: '1.5rem',
  },
  desc: {
    fontSize: '1.05rem',
    lineHeight: '1.9',
    color: '#c7d2da',
    marginBottom: '2rem',
  },
  twoCols: {
    display: 'flex',
    flexDirection: 'row',
    gap: '2rem',
    marginTop: '1.5rem',
    textAlign: 'left',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: '1',
    padding: '1rem',
    borderRadius: '10px',
    background: '#1b232c',
  },
  rightCol: {
    flex: '1',
    padding: '1rem',
    borderRadius: '10px',
    background: '#1b232c',
  },
  companyIntro: {
    fontSize: '0.95rem',
    color: '#b0bec5',
    lineHeight: '1.6',
  },
  detailsBox: {
    marginTop: '1rem',
    marginBottom: '1.5rem',
    padding: '1rem',
    border: '2px solid #FF5722',
    borderRadius: '8px',
    backgroundColor: '#12181f',
    color: '#eee',
  },
  summaryStyle: {
    cursor: 'pointer',
    color: '#ffa270',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  detailInner: {
    marginTop: '1rem',
    lineHeight: '1.7',
    fontSize: '0.9rem',
  },
  addonSection: {
    marginTop: '3rem',
    padding: '3rem',
    backgroundColor: '#161d27',
    borderRadius: '10px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
    textAlign: 'center',
  },
  welcomeTitle: {
    fontSize: '2rem',
    color: '#FF5722',
    marginBottom: '1.2rem',
    fontWeight: '700',
  },
  addonDesc: {
    fontSize: '1.1rem',
    color: '#eceff1',
    marginBottom: '2rem',
  },
  legalBlock: {
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: '#12181f',
    border: '2px solid #FF5722',
    borderRadius: '8px',
    textAlign: 'left',
  },
  extraMarketing: {
    marginTop: '2rem',
    fontSize: '1.2rem',
    color: '#ffd54f',
    fontWeight: '600',
  },
  bottomAction: {
    textAlign: 'center',
    marginTop: '2.5rem',
  },
  pricingBtn: {
    backgroundColor: '#FF5722',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.8rem 2rem',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'transform 0.2s',
  },
};
