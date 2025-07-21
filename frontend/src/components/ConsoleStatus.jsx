import React, { useState, useEffect } from 'react';
import './ConsoleStatus.css';

const ConsoleStatus = () => {
  const [statuses, setStatuses] = useState([
    { id: 1, message: 'Failhttps://cdn.pagesense.io/js/rosettaal/28e1adda6670d4b49f434053ea33db66.js', type: 'error' },
    { id: 2, message: 'ed to load resource: the server responded with a status of 403 ()', type: 'error' },
    { id: 3, message: 'TypeError: null is not an object (evaluating 工序指令元件12:1', type: 'warning' },
    { id: 4, message: "'document.querySelector(\"#.eadboosterContainer\").contentDocument')", type: 'warning' },
    { id: 5, message: 'https://leadbooster-chat.nipeditve.com/chat-anj/nlaybookSettings/95610157-1524-44d3-880f-6e33ab40766f', type: 'error' },
    { id: 6, message: 'Failed to load resource: the server responded with a status of 404 ()', type: 'error' },
    { id: 7, message: 'Unhandled Promise Rejection: dispatchExc... regeneratorRuntime.js:236', type: 'error' },
    { id: 8, message: 'Error', type: 'error' },
  ]);

  const [displayedStatuses, setDisplayedStatuses] = useState([]);

  useEffect(() => {
    setDisplayedStatuses(statuses.slice(-5));
  }, [statuses]);

  return (
    <div className="console-status">
      <div className="console-header">
        <h3>主控台清掃於 {new Date().toLocaleTimeString('zh-TW')}</h3>
      </div>
      <div className="status-list">
        {displayedStatuses.map((status) => (
          <div key={status.id} className={`status-item ${status.type}`}>
            <input
              type="checkbox"
              className="status-checkbox"
              defaultChecked={status.type === 'warning'}
            />
            <span className="status-message">{status.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConsoleStatus;
