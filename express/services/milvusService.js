// express/services/milvusService.js
const { MilvusClient, DataType } = require('@zilliz/milvus2-sdk-node');

// 環境變數 or 預設
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || 'localhost:19530';
// 建立 Milvus client
const milvusClient = new MilvusClient(MILVUS_ADDRESS);

// 假設我們想存 aggregator link => aggregator_links collection
const COLLECTION_NAME = 'aggregator_links';
const VECTOR_DIM = 768; // 依據你的 text embedding 維度自行調整

async function initCollection() {
  // 檢查 collection 是否存在，不存在則建
  const has = await milvusClient.hasCollection({ collection_name: COLLECTION_NAME });
  if (!has.value) {
    await milvusClient.createCollection({
      collection_name: COLLECTION_NAME,
      fields: [
        {
          name: "link_id",
          data_type: DataType.Int64,
          is_primary_key: true,
          autoID: true, // 自動遞增
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
    // TODO: createIndex, loadCollection, ...
  }
}

/**
 * 將 aggregator 搜圖得到的 link list => embedding => insert
 * @param {object} options
 * @param {string} options.fingerprint
 * @param {string[]} options.linkArray
 * @param {(text:string)=>Promise<number[]>} options.embedFunction
 */
async function insertAggregatorLinks({ fingerprint, linkArray, embedFunction }) {
  if (!linkArray || !linkArray.length) return;

  const dataList = [];
  for (const link of linkArray) {
    const vec = await embedFunction(link);
    if (!vec) {
      console.warn('[insertAggregatorLinks] embed fail => skip link=', link);
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

  // 組成 fields_data
  const fields_data = {
    image_fingerprint: dataList.map(d => d.image_fingerprint),
    link_text: dataList.map(d => d.link_text),
    embedding: dataList.map(d => d.embedding),
  };

  const r = await milvusClient.insert({
    collection_name: COLLECTION_NAME,
    fields_data,
  });
  console.log('[insertAggregatorLinks] done =>', r);
}

/**
 * (可選) 以 fingerprint 讀取該圖的 aggregator links
 */
async function getLinksByFingerprint(fingerprint) {
  const r = await milvusClient.query({
    collection_name: COLLECTION_NAME,
    expr: `image_fingerprint == "${fingerprint}"`,
    output_fields: ["link_text", "embedding"],
  });
  // r.data => [ { link_text, embedding, ... }, ...]
  return r.data;
}

/**
 * (可選) 給定 queryText，透過 embeddings search 找到最相似的 aggregator link
 */
async function searchLinksByText(queryText, embedFunction, topK=5) {
  const queryVec = await embedFunction(queryText);
  if (!queryVec) return [];
  const r = await milvusClient.search({
    collection_name: COLLECTION_NAME,
    vectors: [ queryVec ],
    output_fields: ["image_fingerprint","link_text"],
    top_k: topK,
    metric_type: "IP",       // or "L2"
    vector_type: "float",    // float vector
    vector_field_name: "embedding",
  });
  return r.results; // array of { score, id, link_text, image_fingerprint }
}

module.exports = {
  initCollection,
  insertAggregatorLinks,
  getLinksByFingerprint,
  searchLinksByText,
};
