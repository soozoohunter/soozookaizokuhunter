import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import FileCard from '../components/FileCard';
import io from 'socket.io-client';

function DashboardPage() {
  const { token } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

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
    alert(`請求為檔案 #${fileId} 重新掃描...`);
  };

  if (!dashboardData) {
    return null;
  }

  const { protectedContent } = dashboardData;

  return (
    <div>
      {protectedContent.map(file => (
        <FileCard key={file.fileId} file={file} onScan={handleRescan} />
      ))}
    </div>
  );
}

export default DashboardPage;
