import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import FileCard from '../components/FileCard';
import BulkUploader from '../components/BulkUploader';
import io from 'socket.io-client';
import styled from 'styled-components';

function DashboardPage() {
  const { token } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showBulkUploader, setShowBulkUploader] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to load');
      }
      const data = await res.json();
      setDashboardData(data);
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDashboardData();

    const socket = io(process.env.REACT_APP_EXPRESS_BASE_URL || 'https://suzookaizokuhunter.com', {
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('Socket.IO connected!');
    });

    socket.on('scan_update', (update) => {
        console.log('Received scan update:', update);
        setDashboardData(prevData => {
            if (!prevData) return null;
            const newProtectedContent = prevData.protectedContent.map(file => {
                if (file.fileId === update.fileId) {
                    let scanFound = false;
                    const updatedScans = file.scans.map(scan => {
                        if (scan.id === update.taskId) {
                            scanFound = true;
                            return { ...scan, status: update.status, result: update.results };
                        }
                        return scan;
                    });
                    if (!scanFound) {
                        updatedScans.unshift({ id: update.taskId, status: update.status, result: update.results });
                    }
                    return { ...file, scans: updatedScans };
                }
                return file;
            });
            return { ...prevData, protectedContent: newProtectedContent };
        });
    });

    return () => {
        socket.disconnect();
    };
  }, [token]);

  const handleRescan = async (fileId) => {
    setDashboardData(prevData => {
        if (!prevData) return null;
        const newContent = prevData.protectedContent.map(file => {
            if (file.fileId === fileId) {
                const newScans = [{ id: `temp-${Date.now()}`, status: 'pending' }, ...file.scans];
                return { ...file, scans: newScans };
            }
            return file;
        });
        return { ...prevData, protectedContent: newContent };
    });

    try {
        const res = await fetch(`/api/scan/${fileId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || '派發掃描任務失敗');
        }
        const data = await res.json();
        alert(data.message);
    } catch (err) {
        alert(`掃描失敗: ${err.message}`);
        fetchDashboardData();
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (!dashboardData) {
    return null;
  }

  const { protectedContent } = dashboardData;

  return (
    <div>
      <button onClick={() => setShowBulkUploader(true)}>批次上傳</button>
      {showBulkUploader && <BulkUploader onClose={() => setShowBulkUploader(false)} />}
      {protectedContent.map(file => (
        <FileCard key={file.fileId} file={file} onScan={handleRescan} />
      ))}
    </div>
  );
}

export default DashboardPage;
