import React from 'react';
import { useNavigate } from 'react-router-dom';

function RoleSelect() {
  const navigate = useNavigate();

  const goEcommerce = () => {
    // 角色 = ecommerce
    // or redirect to /upload?type=ecommerce
    navigate('/upload?type=ecommerce');
  };

  const goShortVideo = () => {
    navigate('/upload?type=shortVideo');
  };

  return (
    <div style={{ margin: '2rem' }}>
      <h2>選擇您的角色</h2>
      <p>您可以切換為「網路商家」(商品照上傳) 或「短影音網紅」(短影片上傳)。</p>
      <button onClick={goEcommerce}>網路商家 (30張限制)</button>
      <button onClick={goShortVideo}>短影音網紅 (5部限制)</button>
    </div>
  );
}

export default RoleSelect;
