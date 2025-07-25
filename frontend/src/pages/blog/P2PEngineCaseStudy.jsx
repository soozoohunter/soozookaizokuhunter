import React from 'react';
import { useNavigate } from 'react-router-dom';
import ArticleLayout, { ArticleMeta, CTASection, PrimaryButton } from '../../layouts/ArticleLayout';

const P2PEngineCaseStudy = () => {
    const navigate = useNavigate();

    return (
        <ArticleLayout>
            <h1>案例研究：我的商品圖被一頁式詐騙盜用後，如何用 P2P 引擎在 72 小時內將損失轉為收益？</h1>
            <ArticleMeta>發布日期：2025年7月25日 | 閱讀時間：約 6 分鐘</ArticleMeta>

            <p><strong>主角：</strong>陳小姐 (Amy)，一位經營美妝產品的蝦皮賣家，所有商品圖都由她親自拍攝、修圖。</p>
            <h3>事件起因</h3>
            <p>週一早上，Amy 收到一位老顧客的私訊，詢問為何她的明星商品在一個陌生網站上以三折的價格出售。Amy 點開連結，驚見一個完美複製她商品頁面、但收款帳戶完全不同的「一頁式詐騙網站」。更糟糕的是，Facebook 上已經有數個廣告正在大量投放這個假網站。她的品牌信譽和潛在銷售額正以小時為單位在燃燒。</p>
            
            <h3>傳統處理方式的困境</h3>
            <p>Amy 立即向 Facebook 檢舉，並撥打了 165 反詐騙專線。得到的答覆是「已受理，請耐心等候」，但廣告依然在投放，新的詐騙網站如雨後春筍般冒出。她感到無助、憤怒，卻又無計可施。</p>
            
            <h2>導入 SUZOO 後的轉捩點</h2>
            <ol>
                <li><strong>啟動 AI 哨兵：</strong>Amy 使用 SUZOO IP Guard 的 AI 哨兵功能，對她的核心商品圖進行全網掃描。半小時內，系統抓出了 12 個正在盜用她圖片的網站，其中 3 個是有完整公司資訊、看似正規的海外電商。</li>
                <li><strong>一鍵建立 P2P 案件：</strong>對於那 3 個有跡可循的海外電商，Amy 沒有選擇立刻檢舉，而是點擊了<strong>「建立 P2P 維權案件」</strong>。系統立刻為每個侵權連結生成了一個獨一無二的「侵權解決頁面」連結。</li>
                <li><strong>發送「權利通知」：</strong>Amy 透過這 3 個電商網站的聯絡信箱，發送了一封簡短而有力的信件，內容大意是：「貴公司網站未經授權使用了我方受區塊鏈保護的版權圖片，請點擊以下連結查看證據並選擇解決方案。」並附上了那個獨特的連結。</li>
                <li><strong>侵權方的震撼：</strong>對方點開連結後，看到的是一個充滿法律壓迫感的頁面，上面清晰列出了 Amy 作品的區塊鏈存證 Hash 和精確到秒的存證時間。頁面提供了兩個選項：「支付 NT$3,000 購買合法授權」或「面臨基於區塊鏈證據的國際法律程序」。</li>
            </ol>

            <h3>結果</h3>
            <p>在 72 小時內，其中兩家海外電商選擇了支付授權費。Amy 不僅阻止了侵權，還意外獲得了 <strong>NT$6,000</strong> 的額外收入。對於剩下那些純粹的詐騙網站，她則利用 SUZOO 的 DMCA 申訴功能，讓它們在 24 小時內從 Facebook 的廣告中消失。</p>

            <CTASection>
                <h3>您的權利，就是可以交易的資產</h3>
                <p>侵權不應只是損失。SUZOO 的 P2P 變現引擎，將您的著作權從被動的法律權益，轉變為主動出擊、創造收益的商業武器。</p>
                <PrimaryButton onClick={() => navigate('/pricing')}>升級您的方案，立即啟動 P2P 變現引擎</PrimaryButton>
            </CTASection>
        </ArticleLayout>
    );
};

export default P2PEngineCaseStudy;
