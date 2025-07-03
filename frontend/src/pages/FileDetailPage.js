import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function FileDetailPage() {
  const { fileId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/scans/file/${fileId}`)
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(setData)
      .catch(err => {
        console.error(err);
        setError('Failed to load file data');
      });
  }, [fileId]);

  if (error) return <div>{error}</div>;
  if (!data) return <div>Loading...</div>;
  return (
    <div>
      <h2>File Detail</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
