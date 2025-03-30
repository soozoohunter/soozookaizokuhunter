 import React, { useState, useEffect } from 'react';

function InfringementList() {
  const [infringements, setInfringements] = useState([]);
  const [works, setWorks] = useState([]);
  const [msg, setMsg] = useState('');

  const loadInfringements = async () => {
    setMsg('');
    const token = localStorage.getItem('token');
    if(!token) {
      setMsg('尚未登入, 無法查看侵權紀錄');
      return;
    }
    try {
      const resp = await fetch('/api/infringements', {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      const data = await resp.json();
      if(resp.ok) {
        setWorks(data.works);
        setInfringements(data.infringements);
      } else {
        setMsg(`載入失敗: ${data.error}`);
      }
    } catch(e) {
      console.error(e);
      setMsg('載入錯誤');
    }
  };

  useEffect(() => {
    loadInfringements();
  }, []);

  const doLegalize = async (infId) => {
    setMsg('');
    const token = localStorage.getItem('token');
    try {
      const resp = await fetch('/api/infringement/legalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json','Authorization':'Bearer '+token },
        body: JSON.stringify({ infId })
      });
      const data = await resp.json();
      if(resp.ok) {
        setMsg('已標記侵權為「合法」，不再偵測');
        loadInfringements();
      } else {
        setMsg(`操作失敗: ${data.error}`);
      }
    } catch(e) {
      console.error(e);
      setMsg('操作錯誤');
    }
  };

  const doLawsuit = async (infId) => {
    setMsg('');
    const token = localStorage.getItem('token');
    try {
      const resp = await fetch('/api/infringement/lawsuit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json','Authorization':'Bearer '+token },
        body: JSON.stringify({ infId })
      });
      const data = await resp.json();
      if(resp.ok) {
        setMsg('已提交法律訴訟, 狩獵成功！');
        loadInfringements();
      } else {
        setMsg(`操作失敗: ${data.error}`);
      }
    } catch(e) {
      console.error(e);
      setMsg('操作錯誤');
    }
  };

  return (
    <div style={{ margin: '2rem' }}>
      <h2>侵權清單</h2>
      <p style={{ color: 'yellow' }}>{msg}</p>
      <table border="1" cellPadding="8" style={{ borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th>InfrID</th>
            <th>WorkID</th>
            <th>侵權網址</th>
            <th>狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {infringements.map(inf => (
            <tr key={inf.id}>
              <td>{inf.id}</td>
              <td>{inf.workId}</td>
              <td><a href={inf.infringingUrl} target="_blank" rel="noreferrer">{inf.infringingUrl}</a></td>
              <td>{inf.status}</td>
              <td>
                {inf.status==='pending' &&
                  <>
                    <button onClick={()=>doLegalize(inf.id)}>標記合法</button>{' '}
                    <button onClick={()=>doLawsuit(inf.id)}>發起法律訴訟</button>
                  </>
                }
                {inf.status==='legalized' && <span>已合法</span>}
                {inf.status==='lawsuit' && <span>法律訴訟中</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InfringementList;
