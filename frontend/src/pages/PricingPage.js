// frontend/src/pages/PricingPage.js

import React from 'react';
import { Link } from 'react-router-dom';

export default function PricingPage() {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Plans & Pricing 方案與定價</h1>
        <p style={styles.subtitle}>
          Secure your copyrights and trademarks effortlessly with our
          <br/>
          <strong>Blockchain + AI Infringement Detection</strong> system, plus legal support when you need it most.
        </p>
      </header>

      {/* A) 訂閱方案 */}
      <section style={styles.section}>
        <h2 style={styles.orangeText}>Subscription Plans 訂閱方案</h2>
        <p style={styles.sectionDesc}>
          針對經常性保護需求，提供月費/年費訂閱：
          從小量創作者到企業集團都能擁有持續的區塊鏈認證與侵權偵測服務。
        </p>

        <div style={styles.planGrid}>
          {/* Basic */}
          <PlanCard
            planName="BASIC"
            price="NT$490"
            itemParam="basic_plan"
            details={[
              '3 videos, 5 images total',
              '24h infringement detection',
              'Blockchain certificate (unlimited downloads)',
              '1 free DMCA takedown / month'
            ]}
            remark="適合初階創作者 / 部落客"
          />

          {/* Pro */}
          <PlanCard
            planName="PRO"
            price="NT$1290"
            itemParam="pro_plan"
            details={[
              '10 videos, 30 images total',
              'Priority AI scanning (每日輪詢)',
              'Unlimited blockchain certificates',
              '3 free DMCA takedowns / month',
              'Basic legal consultation (email)'
            ]}
            remark="適合專業影音工作室 / 插畫師"
          />

          {/* Enterprise */}
          <PlanCard
            planName="ENTERPRISE"
            price="NT$3990"
            itemParam="enterprise_plan"
            details={[
              'Unlimited videos & images',
              'Real-time AI scanning (即時)',
              'Unlimited DMCA takedowns',
              'Advanced legal coverage (in-house counsel)',
              'Team collaboration (5 seats included)'
            ]}
            remark="適合企業、大型媒體集團"
          />
        </div>
      </section>

      {/* B) 彈性單次付費功能 */}
      <section style={styles.section}>
        <h2 style={styles.orangeText}>Flexible Pay-Per-Feature 彈性功能付費</h2>
        <p style={styles.sectionDesc}>
          不想訂閱也沒關係，以下功能皆可隨需購買：
          先免費上傳 / 免費掃描，確定需要深入保護或提告時再單次付費即可。
        </p>

        <div style={styles.planGrid}>
          <FeatureCard
            planName="Certificate Download"
            price="NT$99 / item"
            itemParam="certificate"
            details={[
              '產出 PDF 原創證明書',
              '包含區塊鏈時間戳 & 哈希值',
              '直接下載即可存證'
            ]}
          />
          <FeatureCard
            planName="Infringement Scan"
            price="NT$99 / item"
            itemParam="scan"
            details={[
              'AI 模擬搜尋結果',
              '確認侵權源頭',
              '僅需付費一次'
            ]}
          />
          <FeatureCard
            planName="DMCA Takedown"
            price="NT$299 / case"
            itemParam="dmca"
            details={[
              '官方DMCA通知流程',
              '下架速度較快',
              '一案付一次'
            ]}
          />
          <FeatureCard
            planName="Legal Support"
            price="NT$9990 / case"
            itemParam="legal"
            details={[
              '智慧財產法律諮詢',
              '律師完整訴訟協助',
              '勝訴後80%賠償歸您'
            ]}
          />
        </div>
      </section>

      {/* C) 訴訟方案 / 額外服務 */}
      <section style={styles.section}>
        <h2 style={styles.orangeText}>IP Litigation & Trademark Services</h2>
        <p style={styles.sectionDesc}>
          若您需要更深入的訴訟處理，或在商標領域進行全球佈局、維權，以下方案供您選擇：
        </p>

        <div style={styles.planGrid}>
          <LitigationCard
            planName="Copyright Litigation"
            price="NT$12,000 ~"
            itemParam="copyright_sue"
            details={[
              '著作權侵權訴訟處理',
              '包含蒐證、函送通知、出庭',
              '勝訴後平台抽成20%'
            ]}
          />
          <LitigationCard
            planName="Trademark Global Filing"
            price="NT$4,999+"
            itemParam="tm_global"
            details={[
              '多國商標註冊申請',
              '搜尋、佈局、續展',
              '一站式服務'
            ]}
          />
          <LitigationCard
            planName="Anti-Counterfeit Action"
            price="Custom"
            itemParam="anti_counterfeit"
            details={[
              '跨境電商掃描 + 海關扣留',
              '法律團隊全面提告',
              'Case-by-case 報價'
            ]}
            remark="適合國際品牌 / 大規模打擊"
          />
        </div>
      </section>
    </div>
  );
}

/* ---------- PlanCard (for subscription plans) ---------- */
function PlanCard({ planName, price, itemParam, details, remark }) {
  const numericPrice = price.replace(/[^0-9]/g, '') || '490'; // 取出數字金額

  return (
    <div style={cardStyles.card}>
      <h3 style={cardStyles.planName}>{planName}</h3>
      <p style={cardStyles.price}>{price}/month</p>
      <ul style={cardStyles.list}>
        {details.map((txt, i) => <li key={i}>{txt}</li>)}
      </ul>
      {remark && <p style={cardStyles.remark}>{remark}</p>}
      
      {/* 按鈕連到 payment 頁, 例如 item=basic_plan, price=490 */}
      <Link 
        to={`/payment?item=${itemParam}&price=${numericPrice}`}
        style={cardStyles.buyBtn}
      >
        Buy Now
      </Link>
    </div>
  );
}

/* ---------- FeatureCard (for pay-per-feature items) ---------- */
function FeatureCard({ planName, price, itemParam, details }) {
  // 僅提取數字部分，預設99
  const numericPrice = price.replace(/[^0-9]/g, '') || '99';

  return (
    <div style={cardStyles.card}>
      <h3 style={cardStyles.planName}>{planName}</h3>
      <p style={cardStyles.price}>{price}</p>
      <ul style={cardStyles.list}>
        {details.map((txt, i) => <li key={i}>{txt}</li>)}
      </ul>
      
      <Link 
        to={`/payment?item=${itemParam}&price=${numericPrice}`}
        style={cardStyles.buyBtn}
      >
        Pay
      </Link>
    </div>
  );
}

/* ---------- LitigationCard (for litigation/trademark services) ---------- */
function LitigationCard({ planName, price, itemParam, details, remark }) {
  // 假設若 price 裡含不只數字(如 "~" 或 "Custom")，取不出則預設10000
  const numericPrice = price.replace(/[^0-9]/g, '') || '10000';

  return (
    <div style={cardStyles.card}>
      <h3 style={cardStyles.planName}>{planName}</h3>
      <p style={cardStyles.price}>{price}</p>
      <ul style={cardStyles.list}>
        {details.map((txt, i) => <li key={i}>{txt}</li>)}
      </ul>
      {remark && <p style={cardStyles.remark}>{remark}</p>}

      {/* 按鈕連到 payment 頁 => item=copyright_sue, price=12000(或10000) */}
      <Link 
        to={`/payment?item=${itemParam}&price=${numericPrice}`}
        style={cardStyles.buyBtn}
      >
        Contact / Pay
      </Link>
    </div>
  );
}

/* --------------- Style --------------- */
const styles = {
  container: {
    backgroundColor: '#0d1117',
    color: '#c9d1d9',
    minHeight: '100vh',
    padding: '3rem'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '2.5rem',
    margin: 0,
    color: '#ff6f00'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#8b949e',
    marginTop: '0.5rem'
  },
  section: {
    marginTop: '3rem'
  },
  sectionDesc: {
    marginTop: '1rem',
    lineHeight: '1.5',
    color: '#ccc',
    fontSize: '0.95rem'
  },
  orangeText: {
    color: '#ff6f00',
    borderBottom: '2px solid #ff6f00',
    display: 'inline-block'
  },
  planGrid: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.5rem',
    flexWrap: 'wrap',
    marginTop: '1.5rem'
  }
};

const cardStyles = {
  card: {
    border: '2px solid #ff6f00',
    borderRadius: '8px',
    padding: '1rem',
    backgroundColor: '#161b22',
    width: '250px',
    textAlign: 'center'
  },
  planName: {
    color: '#ff6f00',
    margin: '0 0 0.5rem',
    fontSize: '1.4rem'
  },
  price: {
    fontWeight: 'bold',
    margin: '0.5rem 0',
    fontSize: '1.2rem'
  },
  list: {
    margin: '1rem 0',
    textAlign: 'left',
    paddingLeft: '1.2rem'
  },
  remark: {
    marginTop: '0.5rem',
    color: '#8b949e',
    fontSize: '0.85rem',
    lineHeight: '1.4'
  },
  buyBtn: {
    display: 'inline-block',
    marginTop: '1rem',
    padding: '0.6rem 1.2rem',
    backgroundColor: '#ff6f00',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '4px'
  }
};
