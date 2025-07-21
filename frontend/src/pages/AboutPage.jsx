import React from 'react';
import styled from 'styled-components';

const PageSpacer = styled.div`
  min-height: 74px;
`;

const Container = styled.div`
  max-width: 1000px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #1F2937;
  border-radius: 12px;
  border: 1px solid #374151;
  color: #D1D5DB;
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  color: #10B981;
  margin-bottom: 1rem;
`;

const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
`;

const TeamMember = styled.div`
  background-color: #111827;
  border-radius: 10px;
  padding: 1.5rem;
  text-align: center;
  border: 1px solid #374151;
`;

const MemberName = styled.h3`
  color: #F3F4F6;
  margin: 1rem 0 0.5rem;
`;

const MemberRole = styled.p`
  color: #9CA3AF;
  font-style: italic;
`;

export default function AboutPage() {
  return (
    <>
      <PageSpacer />
      <Container>
        <h1 style={{textAlign:'center', marginBottom:'2rem'}}>關於 SUZOO IP Guard</h1>

        <Section>
          <SectionTitle>我們的使命</SectionTitle>
          <p>
            在數位時代，創意作品的盜用和侵權問題日益嚴重。SUZOO IP Guard 的使命是為創作者提供最強大的數位作品保護解決方案，讓您能夠安心創作，無需擔心心血被竊取。
          </p>
          <p>
            我們結合區塊鏈技術、數位指紋技術和先進的侵權偵測系統，打造了一個全方位的智慧財產權保護平台，讓您的創作在全球範圍內得到法律認可的保護。
          </p>
        </Section>

        <Section>
          <SectionTitle>技術優勢</SectionTitle>
          <p><strong>區塊鏈存證：</strong> 利用區塊鏈不可篡改的特性，為您的作品生成具有法律效力的時間證明。</p>
          <p><strong>全球法律效力：</strong> 系統基於國際公約（伯恩公約與 WTO/TRIPS 協定），確保證明文件在全球具有參考價值。</p>
          <p><strong>一站式管理：</strong> 從作品上傳、存證到侵權監控，我們提供全流程的管理工具。</p>
        </Section>

        <Section>
          <SectionTitle>我們的團隊</SectionTitle>
          <TeamGrid>
            <TeamMember>
              <MemberName>張智凱</MemberName>
              <MemberRole>創始人兼 CEO</MemberRole>
              <p>前 Google 安全工程師，擁有 10 年區塊鏈經驗</p>
            </TeamMember>
            <TeamMember>
              <MemberName>李思穎</MemberName>
              <MemberRole>法律總監</MemberRole>
              <p>智慧財產權律師，專精數位版權保護</p>
            </TeamMember>
            <TeamMember>
              <MemberName>王建宏</MemberName>
              <MemberRole>技術長</MemberRole>
              <p>區塊鏈安全專家，專利發明人</p>
            </TeamMember>
          </TeamGrid>
        </Section>

        <Section>
          <SectionTitle>全球佈局</SectionTitle>
          <p>
            <strong>Epic Global International Co., Ltd.</strong><br />
            凱盾全球國際股份有限公司 (塞席爾註冊)<br />
            營運總部：台灣台北<br />
            全球註冊地：塞席爾共和國 (聯合國成員國)
          </p>
        </Section>
      </Container>
    </>
  );
}
