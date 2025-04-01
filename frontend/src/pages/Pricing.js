import React from 'react';
import { useTranslation } from 'react-i18next';

function Pricing() {
  const { t } = useTranslation();

  return (
    <div style={{ padding:'1rem' }}>
      <h2>{t('pricingTitle')}</h2>
      <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', justifyContent:'center' }}>
        <div style={{ border:'1px solid #ccc', padding:'1rem', minWidth:'150px' }}>
          <h3>{t('freePlan')}</h3>
          <p>NT$0 / month, up to 3 works</p>
        </div>
        <div style={{ border:'1px solid #ccc', padding:'1rem', minWidth:'150px' }}>
          <h3>{t('advancedPlan')}</h3>
          <p>NT$600 / month, up to 20 works</p>
        </div>
        <div style={{ border:'1px solid #ccc', padding:'1rem', minWidth:'150px' }}>
          <h3>{t('proPlan')}</h3>
          <p>NT$1500 / month, unlimited detection</p>
        </div>
        <div style={{ border:'1px solid #ccc', padding:'1rem', minWidth:'150px' }}>
          <h3>{t('enterprisePlan')}</h3>
          <p>NT$9000 / month, multi-user & API</p>
        </div>
        <div style={{ border:'1px solid #ccc', padding:'1rem', minWidth:'150px' }}>
          <h3>{t('bigCorpPlan')}</h3>
          <p>Contact us for custom plan</p>
        </div>
      </div>
    </div>
  );
}

export default Pricing;
