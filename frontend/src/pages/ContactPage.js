// frontend/src/pages/ContactPage.jsx
import React, { useState } from 'react';
import styled from 'styled-components';

const PageSpacer = styled.div`
  min-height: 74px;
`;

const Container = styled.div`
  margin: 2rem auto;
  padding: 2.5rem;
  max-width: 520px;
  text-align: left;
  background: #F8F8F8;
  border: 1px solid #EAEAEA;
  border-radius: 8px;
`;

const Title = styled.h2`
  text-align: center;
  color: #0A0101;
  margin-bottom: 2rem;
  font-size: 2rem;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  display: block;
  margin: 0.75rem 0 0.25rem;
  color: #333;
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 1rem;
`;

const Textarea = styled.textarea`
  width: 100%;
  height: 120px;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 1rem;
  resize: vertical;
`;

const SubmitButton = styled.button`
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  background: #D45398;
  color: white;
  cursor: pointer;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #C14788;
  }
`;

const ResultMessage = styled.p`
  margin-top: 1.5rem;
  color: #D45398;
  font-weight: bold;
  text-align: center;
`;

export default function ContactUsPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [resultMsg, setResultMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder for submission logic
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
          <Label htmlFor="name">姓名</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />

          <Label htmlFor="email">電子郵件</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          
          <Label htmlFor="message">您的訊息</Label>
          <Textarea id="message" name="message" value={formData.message} onChange={handleChange} required />

          <SubmitButton type="submit">送出</SubmitButton>
        </StyledForm>
        {resultMsg && <ResultMessage>{resultMsg}</ResultMessage>}
      </Container>
    </>
  );
}
