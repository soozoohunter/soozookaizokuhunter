import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { apiClient } from '../apiClient';

const PageContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  color: ${({ theme }) => theme.colors.dark.text};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 0.75rem;
  background: #374151;
  color: white;
  border-bottom: 1px solid ${({ theme }) => theme.colors.dark.border};
`;

const Td = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.dark.border};
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  background: ${({ theme }) => theme.colors.dark.primary};
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
`;

const PaymentApprovalPage = () => {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProofs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/payment-proofs');
      setProofs(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProofs();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('確定要批准此筆付款嗎？')) return;
    try {
      const res = await apiClient.post(`/admin/approve-payment/${id}`);
      alert(res.data.message || '已批准');
      fetchProofs();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <PageContainer>Loading...</PageContainer>;
  if (error) return <PageContainer style={{color:'red'}}>{error}</PageContainer>;

  return (
    <PageContainer>
      <h2>付款審核</h2>
      <Table>
        <thead>
          <tr>
            <Th>ID</Th>
            <Th>用戶</Th>
            <Th>方案</Th>
            <Th>金額</Th>
            <Th>帳號後五碼</Th>
            <Th>操作</Th>
          </tr>
        </thead>
        <tbody>
          {proofs.map((p) => (
            <tr key={p.id}>
              <Td>{p.id}</Td>
              <Td>{p.user?.email || p.user_email}</Td>
              <Td>{p.plan_code}</Td>
              <Td>{p.amount}</Td>
              <Td>{p.account_last_five}</Td>
              <Td><Button onClick={() => handleApprove(p.id)}>批准</Button></Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </PageContainer>
  );
};

export default PaymentApprovalPage;
