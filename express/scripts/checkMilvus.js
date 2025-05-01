const { MilvusClient } = require('@zilliz/milvus2-sdk-node');

// 使用環境變數，或預設為 suzoo_milvus:19530
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || `${process.env.MILVUS_HOST || 'suzoo_milvus'}:${process.env.MILVUS_PORT || '19530'}`;

const client = new MilvusClient({
  address: MILVUS_ADDRESS,
});

async function checkMilvus() {
  console.log(`[Milvus CLI] 嘗試連線至 => ${MILVUS_ADDRESS}...`);

  try {
    const res = await client.listCollections();
    if (res.status.error_code === 'Success') {
      console.log('✅ Milvus 連線成功');
      console.log('目前資料庫中的 Collections：');
      res.data.forEach((col, idx) => {
        console.log(`  ${idx + 1}. ${col.name} (ID: ${col.id})`);
      });
    } else {
      console.error('❌ Milvus 回傳錯誤：', res.status.reason);
    }
  } catch (err) {
    console.error('❌ Milvus 連線失敗：', err.message);
  }
}

checkMilvus();
