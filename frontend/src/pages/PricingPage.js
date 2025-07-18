// frontend/src/pages/PricingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const PageSpacer = styled.div`
  min-height: 74px; /* Matches header height */
`;

const Container = styled.div`
  color: #333;
  padding: 3rem;
  background-color: #fff;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 4rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin: 0;
  color: #0A0101;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #555;
  margin-top: 0.5rem;
`;

const Section = styled.section`
  margin-top: 3rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
`;

const SectionTitle = styled.h2`
  color: #D45398;
  border-bottom: 2px solid #EBB0CF;
  display: inline-block;
  padding-bottom: 8px;
  margin-bottom: 1rem;
`;

const PlanGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  justify-content: center;
  margin-top: 1.5rem;
`;

const Card = styled.div`
  background-color: #F8F8F8;
  border: 1px solid #EAEAEA;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
`;

const PlanName = styled.h3`
  color: #D45398;
  margin: 0 0 0.5rem;
  font-size: 1.4rem;
`;

const Price = styled.p`
  font-weight: bold;
  margin: 0.5rem 0;
  font-size: 1.2rem;
  color: #0A0101;
`;

const List = styled.ul`
  text-align: left;
  padding-left: 1.2rem;
  margin: 1rem 0;
  list-style-type: '✓  ';
  flex-grow: 1;
  color: #444;
`;

const Remark = styled.p`
  color: #888;
  font-size: 0.85rem;
  margin-top: 0.5rem;
`;

const BuyButton = styled(Link)`
  display: inline-block;
  margin-top: 1rem;
  padding: 0.8rem 1.5rem;
  background-color: #D45398;
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #C14788;
  }
`;


export default function PricingPage() {
  return (
    <>
      <PageSpacer />
      <Container>
        <Header>
          <Title>方案與定價</Title>
          <Subtitle>
            選擇最適合您的方案，為您的智慧財產提供堅實的保護。
          </Subtitle>
        </Header>

        <Section>
          <SectionTitle>訂閱方案</SectionTitle>
          <PlanGrid>
            <PlanCard
              planName="BASIC"
              price="NT$490/月"
              details={[
                '3 影片, 5 圖片總數',
                '24小時侵權偵測',
                '區塊鏈證書 (無限下載)',
                '每月 1 次免費 DMCA 下架'
              ]}
              remark="適合初階創作者 / 部落客"
            />
            {/* Add other plan cards here */}
          </PlanGrid>
        </Section>
        {/* Add other sections here */}
      </Container>
    </>
  );
}

function PlanCard({ planName, price, details, remark }) {
  return (
    <Card>
      <PlanName>{planName}</PlanName>
      <Price>{price}</Price>
      <List>
        {details.map((txt, i) => <li key={i}>{txt}</li>)}
      </List>
      {remark && <Remark>{remark}</Remark>}
      <BuyButton to="/register">立即購買</BuyButton>
    </Card>
  );
}
