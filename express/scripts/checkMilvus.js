// ./express/scripts/checkMilvus.js
const { MilvusClient, DataType } = require('@zilliz/milvus2-sdk-node');

// 環境變數
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS
  || `${process.env.MILVUS_HOST || 'suzoo_milvus'}:${process.env.MILVUS_PORT || '19530'}`;

const COLLECTION_NAME = 'aggregator_links';
const VECTOR_DIM = 384;

// 初始化客戶端，調高單次呼叫等待上限 (60秒)
const client = new MilvusClient({
  address: MILVUS_ADDRESS,
  ssl: false,
  channelOptions: {
    'grpc.wait_for_ready_timeout_ms': 60000,
    // 你也可加 'grpc.initial_reconnect_backoff_ms': 8000, 之類
  },
});

/**
 * 重試檢查
 * @param {number} retries - 重試次數
 * @param {number} delayMs - 每次失敗後等待 (毫秒)
 */
async function checkMilvusWithRetry(retries = 8, delayMs = 10000) {
  console.log(`[Milvus CLI] 嘗試連線至 => ${MILVUS_ADDRESS}`);
  for (let i = 0; i < retries; i++) {
    console.log(`[Milvus CLI] 第 ${i+1} 次嘗試 (單次呼叫可等 60 秒)...`);
    try {
      // listCollections() 若 Milvus 未就緒 => 可能 throw Deadline Exceeded
      const res = await client.listCollections();
      if (res.status.error_code === 'Success') {
        console.log('✅ 連線成功，Collections =>', res.data.map(c => c.name));
        await ensureCollection();
        return;
      } else {
        console.warn('❌ 無法列出 Collections =>', res.status.reason);
      }
    } catch (err) {
      console.warn(`[Milvus CLI] 連線失敗 => ${err.message}`);
    }
    if (i < retries - 1) {
      console.log(`等待 ${delayMs/1000} 秒後重試...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  console.error(`❌ 已達 ${retries} 次嘗試，仍無法連線 Milvus。`);
  process.exit(1);
}

/**
 * 確保 aggregator_links 存在，不存在則自動建/索引/load
 */
async function ensureCollection() {
  const listRes = await client.listCollections();
  if (listRes.status.error_code !== 'Success') {
    console.error('❌ 二次 listCollections 仍失敗 =>', listRes.status.reason);
    return;
  }
  const names = listRes.data.map(c => c.name);
  if (!names.includes(COLLECTION_NAME)) {
    console.log(`[INFO] 找不到 '${COLLECTION_NAME}'，將自動建立...`);
    await client.createCollection({
      collection_name: COLLECTION_NAME,
      fields: [
        { name: 'link_id', data_type: DataType.Int64, is_primary_key: true, autoID: true },
        { name: 'image_fingerprint', data_type: DataType.VarChar, max_length: 200 },
        { name: 'link_text', data_type: DataType.VarChar, max_length: 2000 },
        { name: 'embedding', data_type: DataType.FloatVector, dim: VECTOR_DIM },
      ],
    });
    console.log('[CREATE] Collection 建立完成。');

    await client.createIndex({
      collection_name: COLLECTION_NAME,
      field_name: 'embedding',
      index_type: 'IVF_FLAT', // 也可 "IVF_SQ8"/"HNSW"
      metric_type: 'IP',
      params: { nlist: 256 },
    });
    console.log('[INDEX] 向量索引建立完成。');

    await client.loadCollection({ collection_name: COLLECTION_NAME });
    console.log('[LOAD] Collection 已載入記憶體。');
  } else {
    console.log(`[INFO] Collection '${COLLECTION_NAME}' 已存在。顯示欄位：`);
    const desc = await client.describeCollection({ collection_name: COLLECTION_NAME });
    desc.schema.fields.forEach(field => {
      console.log(`  - ${field.name} (${field.data_type})${field.is_primary_key ? ' [PK]' : ''}`);
    });
  }
}

// 執行
(async () => {
  try {
    await checkMilvusWithRetry();
  } catch (e) {
    console.error('❌ 未捕捉異常 =>', e);
    process.exit(1);
  }
})();
