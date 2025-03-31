import React, { useState, useEffect } from 'react';

function InfringementList() {
  const [infs, setInfs] = useState([]);
  useEffect(()=>{
    fetchInfringements();
  },[]);

  const fetchInfringements = async()=>{
    try{
      const resp = await fetch('/api/infringements');
      const data = await resp.json();
      setInfs(data);
    }catch(e){
      console.error(e);
    }
  };

  return (
    <div style={{margin:'2rem'}}>
      <h2>侵權清單</h2>
      <ul>
        {infs.map(item=>(
          <li key={item.id}>
            ID:{item.id}, WorkID:{item.workId}, URL:{item.infringingUrl}, status:{item.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default InfringementList;
