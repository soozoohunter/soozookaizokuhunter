import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import apiClient from '../services/apiClient';

const API_KEY_SERVICES = [
  { id: 'google_vision', name: 'Google Vision' },
  { id: 'tineye', name: 'TinEye' },
  { id: 'dmca', name: 'DMCA.com' },
];

const SettingsPage = () => {
  const { user, updateApiKeysInState } = useContext(AuthContext);
  
  const [keys, setKeys] = useState(user?.apiKeys || {});
  const [status, setStatus] = useState({ saving: false, success: false, error: null });

  useEffect(() => {
    if (user?.apiKeys) {
      setKeys(user.apiKeys);
    }
  }, [user]);

  const handleChange = (service, value) => {
    setKeys(prev => ({ ...prev, [service]: value }));
  };

  const saveKeys = async (e) => {
    e.preventDefault();
    setStatus({ saving: true, success: false, error: null });
    
    try {
      const response = await apiClient.post('/api/users/api-keys', { keys });
      updateApiKeysInState(response.data.keys);
      setStatus({ saving: false, success: true, error: null });
    } catch (error) {
      console.error('保存API金鑰失敗:', error);
      const errorMessage = error.response?.data?.error || '保存失敗，請稍後再試。';
      setStatus({ saving: false, success: false, error: errorMessage });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-white">API 金鑰設定</h1>
      <form onSubmit={saveKeys} className="bg-gray-800 shadow-lg rounded-lg p-6">
        <p className="text-gray-400 mb-6">在此處管理您用於各項第三方服務的 API 金鑰。金鑰將被安全地儲存在後端。</p>
        {API_KEY_SERVICES.map(service => (
          <div key={service.id} className="mb-4">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor={service.id}>
              {service.name} API 金鑰
            </label>
            <input
              id={service.id}
              type="password"
              value={keys[service.id] || ''}
              onChange={(e) => handleChange(service.id, e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline"
              placeholder={`請輸入您的 ${service.name} API 金鑰`}
            />
          </div>
        ))}
        <div className="flex items-center mt-6">
          <button
            type="submit"
            disabled={status.saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors"
          >
            {status.saving ? '保存中...' : '保存設定'}
          </button>
          {status.success && (
            <span className="ml-4 text-green-500">設定已成功保存！</span>
          )}
          {status.error && (
             <span className="ml-4 text-red-500">{status.error}</span>
          )}
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
