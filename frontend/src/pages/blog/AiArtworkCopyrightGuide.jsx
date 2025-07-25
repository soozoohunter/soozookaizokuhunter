import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

import ArticleSignature from '../../components/ArticleSignature';
const PageSpacer = styled.div` min-height: 74px; `;
const ArticleWrapper = styled.div` padding: 4rem 2rem; background: white; `;
const ArticleContainer = styled.article` max-width: 800px; margin: 0 auto; line-height: 1.8; font-size: 1.1rem; `;
const ArticleTitle = styled.h1` font-size: 2.5rem; margin-bottom: 2rem; `;
const CTASection = styled.div`
  margin: 3rem 0; padding: 2rem; background: #f3f4f6; border-radius: 8px;
  text-align: center; border: 2px dashed #D45398;
`;
const PrimaryButton = styled.button`
  text-decoration: none; font-weight: 600; padding: 14px 28px; border-radius: 12px;
  border: 1px solid #D45398; background: #EBB0CF; color: #0A0101;
  box-shadow: 2px 2px 0px #D45398; transition: all 0.2s ease; font-size: 1.1rem;
  margin-top: 1rem; cursor: pointer;
  &:hover { box-shadow: 4px 4px 0px #D45398; transform: translate(-2px, -2px); }
`;

const AiArtworkCopyrightGuide = () => {
    const navigate = useNavigate();
    return (
        <>
            <PageSpacer />
            <ArticleWrapper>
                <ArticleContainer>
                    <ArticleTitle>AI 繪圖算誰的？5 分鐘搞懂 Midjourney 版權歸屬與自保之道</ArticleTitle>
                    <p><strong>前言：</strong>隨著 Midjourney, Stable Diffusion 等 AI 工具的普及，一個全新的法律與創意灰色地帶應運而生：AI 生成的圖片，版權到底屬於誰？是屬於開發 AI 的公司、下達指令的「咒術師」（您），還是屬於全人類的公共領域？</p>
                    <h3>目前的法律觀點</h3>
                    <p>截至 2025 年，全球多數國家的法律（包括美國著作權局的最新指南）普遍認為，完全由 AI 自主生成的、沒有人為獨創性投入的作品，無法獲得傳統著作權保護。然而，關鍵在於「獨創性投入」的定義...</p>
                    <h3>為何您的「Prompt」與創作流程就是獨創性？</h3>
                    <p>您為了生成一張完美的圖片，可能花費了數小時調整、組合、迭代了上百次 Prompt (指令)。這個過程包含了您的美學判斷、語義理解和目標導向的創造力。這整個<strong>創作過程</strong>本身，就是一種需要被保護的智慧財產。當爭議發生時，您需要證明不是您擁有圖片的「所有權」，而是您是這個「創作行為」的<strong>第一人</strong>。</p>
                    <CTASection>
                        <h3>別讓您的「鍊金術」成果，成為他人囊中之物</h3>
                        <p>在法律界定清晰之前，最聰明的做法就是為您的創作過程建立一個堅不可摧的證據。SUZOO IP Guard 能將您的最終作品，連同關鍵的 Prompt 和創作時間，一鍵生成永久的區塊鏈權狀。</p>
                        <PrimaryButton onClick={() => navigate('/free-trial')}>免費取得您的第一份 AI 創作權狀</PrimaryButton>
                    </CTASection>
                    <h3>如何用 SUZOO 自保？</h3>
                    <ol>
                        <li><strong>完成作品</strong>：在您得到滿意的 AI 生成圖片後。</li>
                        <li><strong>立即存證</strong>：透過 SUZOO 的免費體驗，上傳您的圖片，並可在備註中填入您的核心 Prompt。</li>
                        <li><strong>獲取權狀</strong>：系統會立刻為您生成包含時間戳、數位指紋和作品縮圖的區塊鏈證明書。</li>
                    </ol>
                    <p>這份權狀無法被偽造或篡改，它將成為您在任何爭議中，證明您是「第一創作人」的最有力證據。立即行動，保護您在數位鍊金時代中的每一份心血。</p>
                    <hr />
                    <h3>Who Owns AI Art? Understanding Midjourney Copyright in 5 Minutes</h3>
                    <p><strong>Introduction:</strong> With the rise of AI tools like Midjourney and Stable Diffusion, a new legal and creative gray area has emerged: Who holds the copyright to AI-generated images? The AI company, the "prompter" (you), or the public domain?</p>
                    <h4>Current Legal Perspectives</h4>
                    <p>As of 2025, most legal systems, including the U.S. Copyright Office, generally agree that works generated entirely by AI without creative human input cannot be copyrighted in the traditional sense. The key, however, lies in the definition of "creative human input."</p>
                    <h4>Why Your Prompts and Process Are Original Works</h4>
                    <p>You may spend hours refining, combining, and iterating hundreds of prompts to create the perfect image. This process involves your aesthetic judgment, semantic understanding, and goal-oriented creativity. This entire <strong>creative process</strong> is intellectual property that deserves protection. When a dispute arises, you're not just proving ownership of the final image, but that you were the <strong>first person to execute that specific creative act</strong>.</p>
                    <h4>How to Protect Yourself with SUZOO</h4>
                    <p>The smartest move is to create an indestructible evidence trail for your creative process. SUZOO IP Guard allows you to generate a permanent blockchain deed for your final work, complete with your key prompts and a timestamp, giving you the strongest possible evidence of being the "first creator" in any dispute.</p>
    <ArticleSignature />
                </ArticleContainer>
            </ArticleWrapper>
        </>
    );
};

export default AiArtworkCopyrightGuide;
