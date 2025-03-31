import React, { useEffect, useState } from 'react';

function InfringementList() {
  const [list, setList] = useState([]);

  useEffect(()=>{
    fetchInfringements();
  },[]);

  async function fetchInfringements() {
    // 若您在 Express 實作了 GET /api/infringements
    try {
      const resp = await fetch('/api/infringements');
      if(resp.ok){
        const data = await resp.json();
        setList(data);
      } else {
        console.log('取得侵權清單失敗');
      }
    } catch(e){
      console.error(e);
    }
  }

  return (
    <div style={{ margin:'2rem' }}>
      <h2>侵權清單 (假示範)</h2>
      <ul>
        {list.map((item, idx)=>(
          <li key={idx}>
            WorkID: {item.workId}, URL: {item.infringingUrl}, Status: {item.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default InfringementList;
