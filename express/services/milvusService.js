// milvusService.js
const { MilvusClient, DataType } = require('@zilliz/milvus2-sdk-node');

// 連線參數
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || 'localhost:19530';
const client = new MilvusClient(MILVUS_ADDRESS);

// 假設我們建好一個 collection => aggregator_links
// schema => 
//   link_id: DataType.Int64 (auto?), 
//   fingerprint: DataType.VarChar, 
//   link_text: DataType.VarChar, 
//   embedding: DataType.FloatVector(768)

const COLLECTION_NAME = 'aggregator_links';
const VECTOR_DIM = 768; // 依你的模型而定

async function initCollection() {
  // 先檢查 collection 是否存在，若不存在則建立
  const has = await client.hasCollection({ collection_name: COLLECTION_NAME });
  if (!has.value) {
    // create
    await client.createCollection({
      collection_name: COLLECTION_NAME,
      fields: [
        {
          name: "link_id",
          description: "Primary Key",
          data_type: DataType.Int64,
          is_primary_key: true,
          autoID: true
        },
        {
          name: "image_fingerprint",
          data_type: DataType.VarChar,
          max_length: 200
        },
        {
          name: "link_text",
          data_type: DataType.VarChar,
          max_length: 2000
        },
        {
          name: "embedding",
          data_type: DataType.FloatVector,
          dim: VECTOR_DIM
        }
      ],
    });
    console.log(`[Milvus] Collection ${COLLECTION_NAME} created.`);
  }
  // 也可以 createIndex
  // await client.createIndex(...);
}

async function insertAggregatorLinks({ fingerprint, linkArray, embedFunction }) {
  // linkArray: string[] => aggregator 結果
  // embedFunction: (text)=>Promise<float[]> => embedding 函式
  if(!linkArray || linkArray.length===0) return;

  // batch embedding
  const dataList = [];
  for (let txt of linkArray) {
    const vec = await embedFunction(txt);
    if (!vec) {
      console.warn('embedding fail => skip', txt);
      continue;
    }
    dataList.push({
      image_fingerprint: fingerprint,
      link_text: txt,
      embedding: vec,
    });
  }
  // Milvus 要求批次插入 structured
  // link_id 若 autoID=true 可以不用塞
  const fields_data = {
    image_fingerprint: dataList.map(d=> d.image_fingerprint),
    link_text: dataList.map(d=> d.link_text),
    embedding: dataList.map(d=> d.embedding),
  };
  
  // insert
  const r = await client.insert({
    collection_name: COLLECTION_NAME,
    fields_data: fields_data,
  });
  console.log('[insertAggregatorLinks] done =>', r);
}

// 簡易用 PK / filter 找出同 fingerprint 之 aggregator links
async function getAggregatorLinksByFingerprint(fingerprint) {
  // method 1: query  (Milvus SDK v2 會有 query API)
  const r = await client.query({
    collection_name: COLLECTION_NAME,
    expr: `image_fingerprint == "${fingerprint}"`,
    output_fields: ["link_text", "embedding"]
  });
  // r.data => [{ link_text, embedding, ...}, ...]
  return r.data;
}

// 如果你要用向量查跟 aggregator link “語意相似”的 link，也可以做 search
// (例如, 給定一段文字 embedding 來匹配 link_text)
async function searchSimilarLinksByText(queryText, embedFunction, topK=5) {
  const queryVec = await embedFunction(queryText);
  if(!queryVec) return [];

  const searchRes = await client.search({
    collection_name: COLLECTION_NAME,
    vectors: [ queryVec ],
    output_fields: ["link_text","image_fingerprint"],
    top_k: topK,
    metric_type: "IP",
    vector_type: "float",
    vector_field_name: "embedding"
  });
  // return searchRes.results => [{score, id, link_text, image_fingerprint}, ...]
  return searchRes.results;
}

module.exports = {
  initCollection,
  insertAggregatorLinks,
  getAggregatorLinksByFingerprint,
  searchSimilarLinksByText,
};
