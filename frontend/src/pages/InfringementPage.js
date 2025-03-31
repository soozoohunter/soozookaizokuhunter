import React, { useEffect, useState } from 'react';

export default function InfringementPage() {
  const [works, setWorks] = useState([]);
  const [infs, setInfs] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(()=>{
    fetchInfringements();
  },[]);

  const fetchInfringements = async() => {
    try {
      const res = await fetch('/api/infringements', {
        headers:{ 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if(res.ok) {
        setWorks(data.works);
        setInfs(data.infringements);
      } else {
        alert(`讀取侵權清單失敗: ${data.error||'未知錯誤'}`);
      }
    } catch(err) {
      alert(`發生錯誤: ${err.message}`);
    }
  };

  // 標記合法
  const handleLegalize = async(infId)=>{
    if(!window.confirm('確定要標記此侵權為合法授權？往後將不再偵測。')) return;
    try {
      const res = await fetch('/api/infringement/legalize', {
        method:'POST',
        headers:{
          'Authorization': `Bearer ${token}`,
          'Content-Type':'application/json'
        },
        body: JSON.stringify({ infId })
      });
      const data = await res.json();
      if(res.ok) {
        alert('已標記為合法');
        fetchInfringements();
      } else {
        alert(`失敗: ${data.error||'未知錯誤'}`);
      }
    } catch(e) {
      alert(`錯誤: ${e.message}`);
    }
  };

  // DMCA 申訴
  const handleDmca = async(workId, infringingUrl)=>{
    if(!window.confirm('確定要對此侵權內容提出 DMCA 申訴嗎？')) return;
    try {
      const res = await fetch('/api/dmca/report', {
        method:'POST',
        headers:{
          'Authorization': `Bearer ${token}`,
          'Content-Type':'application/json'
        },
        body: JSON.stringify({ workId, infringingUrl })
      });
      const data = await res.json();
      if(res.ok) {
        alert('DMCA 已提交');
        fetchInfringements();
      } else {
        alert(`失敗: ${data.error||'未知錯誤'}`);
      }
    } catch(e) {
      alert(`錯誤: ${e.message}`);
    }
  };

  // 要求付費購買授權
  const handleLicFee = async(infId)=>{
    let fee = prompt('請輸入您希望對方支付的授權費 (數字)：');
    if(!fee) return;
    if(!window.confirm(`確定要向對方請求授權費 ${fee} 元?`)) return;
    try {
      const res = await fetch('/api/infringement/requestLicensingFee', {
        method:'POST',
        headers:{
          'Authorization': `Bearer ${token}`,
          'Content-Type':'application/json'
        },
        body: JSON.stringify({ infId, licensingFee: fee })
      });
      const data = await res.json();
      if(res.ok) {
        alert('已發送授權費通知');
        fetchInfringements();
      } else {
        alert(`失敗: ${data.error||'未知錯誤'}`);
      }
    } catch(e) {
      alert(`錯誤: ${e.message}`);
    }
  };

  // 提交法律訴訟
  const handleLawsuit = async(infId)=>{
    let demanded = prompt('請輸入您希望索賠的金額:');
    if(!demanded) return;
    if(!window.confirm(`確定要提告並索賠 ${demanded} 元嗎？後續需支付額外費用`)) return;
    try {
      const res = await fetch('/api/infringement/lawsuit', {
        method:'POST',
        headers:{
          'Authorization': `Bearer ${token}`,
          'Content-Type':'application/json'
        },
        body: JSON.stringify({ infId, demandedPrice: demanded })
      });
      const data = await res.json();
      if(res.ok) {
        alert('已發起法律訴訟程序');
        fetchInfringements();
      } else {
        alert(`失敗: ${data.error||'未知錯誤'}`);
      }
    } catch(e) {
      alert(`錯誤: ${e.message}`);
    }
  };

  return (
    <div style={{padding:20}}>
      <h2>侵權管理</h2>
      <p>以下列出您上傳的作品與其侵權狀況：</p>
      <div style={{display:'flex', gap:'20px'}}>
        
        {/* 作品清單 */}
        <div style={styles.column}>
          <h3>我的作品</h3>
          {works.map(w=>(
            <div key={w.id} style={styles.card}>
              <p>作品ID: {w.id}</p>
              <p>標題: {w.title}</p>
              <p>Fingerprint: {w.fingerprint.slice(0,20)}...</p>
              <img 
                src={w.fileType==='image' ? w.cloudinaryUrl : '/video_icon.png'} 
                alt="work" 
                style={{ maxWidth:'100px'}}
              />
            </div>
          ))}
        </div>

        {/* 侵權清單 */}
        <div style={styles.column}>
          <h3>侵權列表</h3>
          {infs.map(inf=>(
            <div key={inf.id} style={styles.card}>
              <p>侵權ID: {inf.id}</p>
              <p>WorkID: {inf.workId}</p>
              <p>侵權網址: {inf.infringingUrl}</p>
              <p>狀態: {inf.status}</p>
              <div style={styles.btnGroup}>
                {inf.status==='pending' && (
                  <>
                    <button onClick={()=>handleLegalize(inf.id)}>標記合法</button>
                    <button onClick={()=>handleDmca(inf.workId, inf.infringingUrl)}>DMCA 申訴</button>
                    <button onClick={()=>handleLicFee(inf.id)}>要求付費</button>
                    <button onClick={()=>handleLawsuit(inf.id)}>提交訴訟</button>
                  </>
                )}
                {inf.status==='legalized' && <p>已合法授權</p>}
                {inf.status==='lawsuit' && <p>已進入訴訟程序</p>}
                {inf.status==='licensingFeeRequested' && <p>已要求付費</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  column:{
    flex:'1'
  },
  card:{
    border:'1px solid #ccc',
    padding:'10px',
    marginBottom:'10px',
    borderRadius:'6px'
  },
  btnGroup:{
    marginTop:'10px'
  }
};
