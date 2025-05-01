// scripts/checkMilvus.js
const { MilvusClient, DataType } = require('@zilliz/milvus2-sdk-node');

// 預設連線 "suzoo_milvus:19530"；也可由環境變數指定
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS 
  || `${process.env.MILVUS_HOST || 'suzoo_milvus'}:${process.env.MILVUS_PORT || '19530'}`;

const COLLECTION_NAME = 'aggregator_links';
const VECTOR_DIM = 384;

// 客戶端初始化，可加入 channelOptions 調整 gRPC timeout 等
const client = new MilvusClient({
  address: MILVUS_ADDRESS,
  ssl: false,
  channelOptions: {
    // 可視需要額外設定： 'grpc.initial_reconnect_backoff_ms': 2000, ...
    // 'grpc.max_receive_message_length': 1024 * 1024 * 100,
  },
});

/**
 * 帶重試的連線檢查
 */
async function checkMilvusWithRetry(retries = 8, delayMs = 5000) {
  for (let i = 0; i < retries; i++) {
    console.log(`[Milvus CLI] 第 ${i+1} 次嘗試 => ${MILVUS_ADDRESS}`);
    try {
      const res = await client.listCollections(); 
      if (res.status.error_code === 'Success') {
        console.log('✅ 已連線 Milvus。現有 Collections：', res.data.map(c => c.name));
        await ensureCollection();
        return; 
      } else {
        console.warn('❌ 無法列出 Collections：', res.status.reason);
      }
    } catch (err) {
      console.warn(`[Milvus CLI] 連線失敗 => ${err.message}`);
    }
    console.log(`等待 ${delayMs/1000} 秒後重試...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  console.error('❌ 已達最大重試次數，仍無法連線 Milvus。');
  process.exit(1);
}

/**
 * 確保特定 Collection 存在、並建立索引
 */
async function ensureCollection() {
  console.log('[ensureCollection] 開始檢查/建立 Collection...');
  const listRes = await client.listCollections();
  if (listRes.status.error_code !== 'Success') {
    console.error('❌ 無法列出 Collections：', listRes.status.reason);
    return;
  }
  const names = listRes.data.map(col => col.name);
  if (!names.includes(COLLECTION_NAME)) {
    console.log(`[INFO] 找不到 collection '${COLLECTION_NAME}'，將自動建立...`);
    await client.createCollection({
      collection_name: COLLECTION_NAME,
      fields: [
        { name: "link_id", data_type: DataType.Int64, is_primary_key: true, autoID: true },
        { name: "image_fingerprint", data_type: DataType.VarChar, max_length: 200 },
        { name: "link_text", data_type: DataType.VarChar, max_length: 2000 },
        { name: "embedding", data_type: DataType.FloatVector, dim: VECTOR_DIM },
      ],
    });
    console.log('[CREATE] Collection 建立完成');

    await client.createIndex({
      collection_name: COLLECTION_NAME,
      field_name: 'embedding',
      index_type: 'IVF_FLAT', // or "HNSW","IVF_SQ8" 等
      metric_type: 'IP',      // or "L2","COSINE"
      params: { nlist: 256 },
    });
    console.log('[INDEX] 向量索引建立完成');

    await client.loadCollection({ collection_name: COLLECTION_NAME });
    console.log('[LOAD] Collection 已載入記憶體');
  } else {
    console.log(`[INFO] Collection '${COLLECTION_NAME}' 已存在`);
    const desc = await client.describeCollection({ collection_name: COLLECTION_NAME });
    desc.schema.fields.forEach(field => {
      console.log(`  - ${field.name} (${field.data_type})${field.is_primary_key ? ' [PK]' : ''}`);
    });
  }
}

(async () => {
  console.log(`[Milvus CLI] 嘗試連線至 => ${MILVUS_ADDRESS}`);
  await checkMilvusWithRetry();
})();
