import React, { useState } from 'react';
import styled from 'styled-components';

const PageSpacer = styled.div`
  min-height: 74px;
`;

const Container = styled.div`
  margin: 4rem auto;
  padding: 2.5rem;
  max-width: 520px;
  text-align: left;
  background: ${({ theme }) => theme.colors.light.card};
  border: 1px solid ${({ theme }) => theme.colors.light.border};
  border-radius: ${({ theme }) => theme.borderRadius};
`;

const Title = styled.h2`
  text-align: center;
  color: ${({ theme }) => theme.colors.light.text};
  margin-bottom: 2rem;
  font-size: 2rem;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Label = styled.label`
  display: block;
  color: #333;
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
`;

const Textarea = styled.textarea`
  width: 100%;
  height: 120px;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  resize: vertical;
`;

const SubmitButton = styled.button`
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  border: none;
  background: ${({ theme }) => theme.colors.light.primary};
  color: white;
  cursor: pointer;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.light.primaryHover};
  }
`;

const ResultMessage = styled.p`
  margin-top: 1.5rem;
  color: ${({ theme }) => theme.colors.light.primary};
  font-weight: bold;
  text-align: center;
`;

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [resultMsg, setResultMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setResultMsg('感謝您的聯絡，我們已收到您的訊息！');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <>
      <PageSpacer />
      <Container>
        <Title>聯絡我們</Title>
        <StyledForm onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="name">姓名</Label>
            <Input id="name" name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div>
            <Label htmlFor="email">電子郵件</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div>
            <Label htmlFor="message">您的訊息</Label>
            <Textarea id="message" name="message" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} required />
          </div>
          <SubmitButton type="submit">送出</SubmitButton>
        </StyledForm>
        {resultMsg && <ResultMessage>{resultMsg}</ResultMessage>}
      </Container>
    </>
  );
}
