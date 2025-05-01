// scripts/checkMilvus.js
const { MilvusClient, DataType } = require('@zilliz/milvus2-sdk-node');

const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || `${process.env.MILVUS_HOST || 'suzoo_milvus'}:${process.env.MILVUS_PORT || '19530'}`;
const COLLECTION_NAME = 'aggregator_links';
const VECTOR_DIM = 384;

const client = new MilvusClient({ address: MILVUS_ADDRESS });

async function checkMilvus() {
  console.log(`[Milvus CLI] 嘗試連線至 => ${MILVUS_ADDRESS}...`);
  try {
    const res = await client.listCollections();
    if (res.status.error_code !== 'Success') {
      console.error('❌ 無法列出 Collections：', res.status.reason);
      return;
    }
    const names = res.data.map(col => col.name);
    console.log('✅ 已連線 Milvus。現有 collections：');
    names.forEach((n, i) => console.log(`  ${i + 1}. ${n}`));

    if (!names.includes(COLLECTION_NAME)) {
      console.log(`
[INFO] 找不到 collection '${COLLECTION_NAME}'，將自動建立...`);
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
        index_type: 'IVF_FLAT',
        metric_type: 'IP',
        params: { nlist: 256 },
      });
      console.log('[INDEX] 向量索引建立完成');

      await client.loadCollection({ collection_name: COLLECTION_NAME });
      console.log('[LOAD] Collection 已載入記憶體');
    } else {
      console.log(`
[INFO] Collection '${COLLECTION_NAME}' 已存在，顯示欄位資訊：`);
      const desc = await client.describeCollection({ collection_name: COLLECTION_NAME });
      desc.schema.fields.forEach(field => {
        console.log(`  - ${field.name} (${field.data_type})${field.is_primary_key ? ' [PK]' : ''}`);
      });
    }
  } catch (err) {
    console.error('❌ 發生錯誤：', err.message);
  }
}

checkMilvus();
