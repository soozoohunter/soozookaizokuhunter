// ./express/scripts/checkMilvus.js
const { MilvusClient, DataType } = require('@zilliz/milvus2-sdk-node');

// 環境變數預設
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS
  || `${process.env.MILVUS_HOST || 'suzoo_milvus'}:${process.env.MILVUS_PORT || '19530'}`;

const COLLECTION_NAME = 'aggregator_links';
const VECTOR_DIM = 384;

// 客戶端初始化 + 調整 gRPC timeout
const client = new MilvusClient({
  address: MILVUS_ADDRESS,
  ssl: false,
  // channelOptions 可放更多 gRPC 參數，如初始重連延遲、metadata大小等
  channelOptions: {
    'grpc.wait_for_ready_timeout_ms': 60000, // 單次呼叫允許等待 60 秒
    // 或 'grpc.initial_reconnect_backoff_ms': 5000,
  },
});

/** 主流程：重試機制 */
async function checkMilvusWithRetry(retries = 8, delayMs = 10000) {
  console.log(`[Milvus CLI] 嘗試連線至 => ${MILVUS_ADDRESS}`);
  for (let i = 0; i < retries; i++) {
    console.log(`[Milvus CLI] 第 ${i+1} 次嘗試 (每次等待最長 60 秒)...`);
    try {
      // 單次呼叫 listCollections，若 Milvus 還未就緒或超時 => throw
      const res = await client.listCollections();
      if (res.status.error_code === 'Success') {
        console.log('✅ 連線成功，Collections：', res.data.map(c => c.name));
        await ensureCollection();
        return;
      } else {
        console.warn('❌ 無法列出 Collections：', res.status.reason);
      }
    } catch (err) {
      console.warn(`[Milvus CLI] 連線失敗 => ${err.message}`);
    }
    if (i < retries - 1) {
      console.log(`等待 ${delayMs / 1000} 秒後重試...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  console.error('❌ 已達最大重試次數，仍無法連線 Milvus。');
  process.exit(1); // 容器將以 code 1 結束 => Docker 可視 restart 策略再重啟
}

/** 若無 aggregator_links，就自動建立 + load + 建索引 */
async function ensureCollection() {
  const listRes = await client.listCollections();
  if (listRes.status.error_code !== 'Success') {
    console.error('❌ 無法列出 Collections =>', listRes.status.reason);
    return;
  }
  const names = listRes.data.map(col => col.name);
  if (!names.includes(COLLECTION_NAME)) {
    console.log(`[INFO] 找不到 collection '${COLLECTION_NAME}'，將自動建立...`);
    await client.createCollection({
      collection_name: COLLECTION_NAME,
      fields: [
        { name: 'link_id', data_type: DataType.Int64, is_primary_key: true, autoID: true },
        { name: 'image_fingerprint', data_type: DataType.VarChar, max_length: 200 },
        { name: 'link_text', data_type: DataType.VarChar, max_length: 2000 },
        { name: 'embedding', data_type: DataType.FloatVector, dim: VECTOR_DIM },
      ],
    });
    console.log('[CREATE] Collection 建立完成');

    await client.createIndex({
      collection_name: COLLECTION_NAME,
      field_name: 'embedding',
      index_type: 'IVF_FLAT', // or "IVF_SQ8" / "HNSW"
      metric_type: 'IP',
      params: { nlist: 256 },
    });
    console.log('[INDEX] 向量索引建立完成');

    await client.loadCollection({ collection_name: COLLECTION_NAME });
    console.log('[LOAD] Collection 已載入記憶體');
  } else {
    console.log(`[INFO] Collection '${COLLECTION_NAME}' 已存在 => 顯示欄位資訊：`);
    const desc = await client.describeCollection({ collection_name: COLLECTION_NAME });
    desc.schema.fields.forEach(field => {
      console.log(`  - ${field.name} (${field.data_type})${field.is_primary_key ? ' [PK]' : ''}`);
    });
  }
}

// 程式進入點
checkMilvusWithRetry().catch(e => {
  console.error('❌ checkMilvusWithRetry 出現未捕捉異常 =>', e);
  process.exit(1);
});
