document.addEventListener('DOMContentLoaded', () => {
    // 您的後端 API 端點
    const takedownApiUrl = '/api/protect/request-takedown-via-api'; 

    // 為所有 class 為 'dmca-takedown-button' 的按鈕綁定點擊事件
    document.querySelectorAll('.dmca-takedown-button').forEach(button => {
        button.addEventListener('click', handleTakedownRequest);
    });

    async function handleTakedownRequest(event) {
        const button = event.target;
        // 從按鈕的 data-* 屬性中獲取必要的資訊
        const { clientUserId, originalFileId, infringingUrl } = button.dataset;

        if (!clientUserId || !originalFileId || !infringingUrl) {
            alert('錯誤：按鈕缺少必要的案件資訊 (data- attributes)');
            return;
        }

        if (!window.confirm(`您確定要對以下侵權連結提交 DMCA 下架請求嗎？\n\n${infringingUrl}`)) {
            return;
        }

        // 提供視覺回饋，防止重複點擊
        button.disabled = true;
        button.textContent = '提交中...';
        const statusCell = document.getElementById(`status-${originalFileId}-${infringingUrl.replace(/[^a-zA-Z0-9]/g, '')}`); // 動態找到對應的狀態欄位

        try {
            const response = await fetch(takedownApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientUserId: parseInt(clientUserId, 10),
                    originalFileId: parseInt(originalFileId, 10),
                    infringingUrl: infringingUrl
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert(`成功！案件已提交至 DMCA.com，案件 ID: ${result.dmcaCaseId}`);
                if(statusCell) statusCell.innerHTML = `<span style="color: green;">已提交 (ID: ${result.dmcaCaseId})</span>`;
                button.textContent = '已提交';
            } else {
                throw new Error(result.detail || result.message || '發生未知錯誤');
            }

        } catch (error) {
            console.error('DMCA request failed:', error);
            alert(`發送失敗：${error.message}`);
            if(statusCell) statusCell.innerHTML = `<span style="color: red;">提交失敗</span>`;
            button.disabled = false; // 讓用戶可以重試
            button.textContent = '發送 DMCA 通知';
        }
    }
});
