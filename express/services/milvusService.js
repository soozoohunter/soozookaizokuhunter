const { MilvusClient, DataType } = require('@zilliz/milvus2-sdk-node');

// 請注意：docker-compose 裡 milvus 容器服務名稱是 "milvus"；port 預設 19530
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || 'milvus:19530';

// 建立 Milvus client
const milvusClient = new MilvusClient(MILVUS_ADDRESS);

// 假設要存 aggregator_links
const COLLECTION_NAME = 'aggregator_links';
// 如果使用 'all-MiniLM-L6-v2' 模型，維度是 384；若換別的模型(768)則改數字
const VECTOR_DIM = 384;

async function initCollection() {
  try {
    const has = await milvusClient.hasCollection({ collection_name: COLLECTION_NAME });
    if (!has.value) {
      await milvusClient.createCollection({
        collection_name: COLLECTION_NAME,
        fields: [
          {
            name: "link_id",
            data_type: DataType.Int64,
            is_primary_key: true,
            autoID: true,
          },
          {
            name: "image_fingerprint",
            data_type: DataType.VarChar,
            max_length: 200,
          },
          {
            name: "link_text",
            data_type: DataType.VarChar,
            max_length: 2000,
          },
          {
            name: "embedding",
            data_type: DataType.FloatVector,
            dim: VECTOR_DIM,
          },
        ],
      });
      console.log(`[Milvus] Collection created => ${COLLECTION_NAME}`);

      // 建 Index
      await milvusClient.createIndex({
        collection_name: COLLECTION_NAME,
        field_name: 'embedding',
        index_type: 'IVF_FLAT', // or IVF_SQ8 / HNSW / etc
        metric_type: 'IP',      // 內積
        params: { nlist: 256 },
      });

      // 載入
      await milvusClient.loadCollection({
        collection_name: COLLECTION_NAME,
      });
    }
  } catch (err) {
    console.error('[initCollection] error =>', err);
  }
}

/**
 * 將 aggregator 搜圖 or manual_links => embedding => insert
 */
async function insertAggregatorLinks({ fingerprint, linkArray, embedFunction }) {
  if (!linkArray || !linkArray.length) return;

  const dataList = [];
  for (const link of linkArray) {
    let vec = null;
    try {
      vec = await embedFunction(link);
    } catch(eEmb) {
      console.warn('[insertAggregatorLinks] embed fail =>', eEmb);
    }
    if (!vec || !Array.isArray(vec)) {
      console.warn('[insertAggregatorLinks] skip link=', link);
      continue;
    }
    dataList.push({
      image_fingerprint: fingerprint,
      link_text: link,
      embedding: vec,
    });
  }
  if (!dataList.length) {
    console.warn('[insertAggregatorLinks] no valid embeddings => skip');
    return;
  }

  const fields_data = {
    image_fingerprint: dataList.map(d => d.image_fingerprint),
    link_text: dataList.map(d => d.link_text),
    embedding: dataList.map(d => d.embedding),
  };

  try {
    const r = await milvusClient.insert({
      collection_name: COLLECTION_NAME,
      fields_data,
    });
    console.log('[insertAggregatorLinks] done =>', r);
  } catch(e) {
    console.error('[insertAggregatorLinks] insert error =>', e);
  }
}

/**
 * (可選) 給 fingerprint 查詢
 */
async function getLinksByFingerprint(fingerprint) {
  try {
    const r = await milvusClient.query({
      collection_name: COLLECTION_NAME,
      expr: `image_fingerprint == "${fingerprint}"`,
      output_fields: ["link_text", "embedding"],
    });
    return r.data;
  } catch(e) {
    console.error('[getLinksByFingerprint] error =>', e);
    return [];
  }
}

/**
 * (可選) 以 queryText => embed => search => 回傳 topK
 */
async function searchLinksByText(queryText, embedFunction, topK=5) {
  const queryVec = await embedFunction(queryText);
  if (!queryVec) return [];
  try {
    const r = await milvusClient.search({
      collection_name: COLLECTION_NAME,
      vectors: [ queryVec ],
      output_fields: ["image_fingerprint","link_text"],
      top_k: topK,
      metric_type: "IP",
      vector_type: "float",
      vector_field_name: "embedding",
    });
    return r.results || [];
  } catch(e) {
    console.error('[searchLinksByText] error =>', e);
    return [];
  }
}

module.exports = {
  initCollection,
  insertAggregatorLinks,
  getLinksByFingerprint,
  searchLinksByText,
};
