import React, { useState, useEffect } from 'react';

export default function InfringementList() {
  const [infrs, setInfrs] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(()=>{
    fetchList();
  },[]);

  async function fetchList(){
    try{
      const resp = await fetch('/api/infr/list',{
        headers:{ 'Authorization':'Bearer '+token }
      });
      const data = await resp.json();
      if(!resp.ok) throw new Error(data.error||'抓取侵權清單失敗');
      setInfrs(data);
    } catch(e){
      console.error(e);
      alert(e.message);
    }
  }

  async function doLegal(infId){
    if(!window.confirm('確定要標記該侵權為合法授權嗎？')) return;
    try{
      const resp = await fetch('/api/infr/legalize',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':'Bearer '+token
        },
        body: JSON.stringify({ infId })
      });
      const data=await resp.json();
      if(!resp.ok) throw new Error(data.error||'標記失敗');
      alert('已標記合法');
      fetchList();
    }catch(e){
      console.error(e);
      alert(e.message);
    }
  }

  async function doDmca(inf){
    if(!window.confirm('確定要對此侵權提起 DMCA 嗎？')) return;
    try{
      const body={workId:inf.workId, infringingUrl:inf.infringingUrl};
      const resp=await fetch('/api/infr/dmca',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':'Bearer '+token
        },
        body: JSON.stringify(body)
      });
      const data=await resp.json();
      if(!resp.ok) throw new Error(data.error||'DMCA失敗');
      alert('DMCA已提交');
      fetchList();
    }catch(e){
      alert(e.message);
    }
  }

  async function doLicenseFee(inf){
    let price= prompt('請輸入和解/授權金額', '1000');
    if(!price) return;
    try{
      const resp=await fetch('/api/infr/licenseFee',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':'Bearer '+token
        },
        body: JSON.stringify({ infId:inf.id, demandedPrice:price})
      });
      const data=await resp.json();
      if(!resp.ok) throw new Error(data.error||'要求授權費失敗');
      alert('已要求授權費:'+ price);
      fetchList();
    }catch(e){
      alert(e.message);
    }
  }

  async function doLawsuit(infId){
    if(!window.confirm('確定要提告？需支付費用。')) return;
    try{
      const resp=await fetch('/api/infr/lawsuit',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':'Bearer '+token
        },
        body: JSON.stringify({ infId })
      });
      const data=await resp.json();
      if(!resp.ok) throw new Error(data.error||'提告失敗');
      alert('已提交訴訟！');
      fetchList();
    }catch(e){
      alert(e.message);
    }
  }

  return (
    <div style={{margin:'2rem'}}>
      <h2>侵權紀錄</h2>
      {infrs.length===0?(
        <p>目前無侵權紀錄</p>
      ):(
        <ul>
          {infrs.map((inf)=>(
            <li key={inf.id}>
              [ID:{inf.id}] WorkID:{inf.workId}, URL:{inf.infringingUrl}, Status:{inf.status}
              <button onClick={()=>doLegal(inf.id)}>合法</button>
              <button onClick={()=>doDmca(inf)}>DMCA</button>
              <button onClick={()=>doLicenseFee(inf)}>授權費</button>
              <button onClick={()=>doLawsuit(inf.id)}>提告</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
