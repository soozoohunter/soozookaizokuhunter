const { MilvusClient, DataType } = require('@zilliz/milvus2-sdk-node');

// 改為使用 .env 環境變數（可透過 docker-compose 傳入）
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || `${process.env.MILVUS_HOST || 'suzoo_milvus'}:${process.env.MILVUS_PORT || '19530'}`;

// 初始化 Milvus Client
const milvusClient = new MilvusClient({
  address: MILVUS_ADDRESS
});

const COLLECTION_NAME = 'aggregator_links';
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

      await milvusClient.createIndex({
        collection_name: COLLECTION_NAME,
        field_name: 'embedding',
        index_type: 'IVF_FLAT',
        metric_type: 'IP',
        params: { nlist: 256 },
      });

      await milvusClient.loadCollection({ collection_name: COLLECTION_NAME });
    }
  } catch (err) {
    console.error('[initCollection] error =>', err);
  }
}

async function insertAggregatorLinks({ fingerprint, linkArray, embedFunction }) {
  if (!linkArray || !linkArray.length) return;

  const dataList = [];
  for (const link of linkArray) {
    let vec = null;
    try {
      vec = await embedFunction(link);
    } catch (eEmb) {
      console.warn('[insertAggregatorLinks] embed fail =>', eEmb);
    }

    if (!vec || !Array.isArray(vec)) {
      console.warn('[insertAggregatorLinks] skip link =', link);
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
  } catch (e) {
    console.error('[insertAggregatorLinks] insert error =>', e);
  }
}

async function getLinksByFingerprint(fingerprint) {
  try {
    const r = await milvusClient.query({
      collection_name: COLLECTION_NAME,
      expr: `image_fingerprint == "${fingerprint}"`,
      output_fields: ["link_text", "embedding"],
    });
    return r.data;
  } catch (e) {
    console.error('[getLinksByFingerprint] error =>', e);
    return [];
  }
}

async function searchLinksByText(queryText, embedFunction, topK = 5) {
  const queryVec = await embedFunction(queryText);
  if (!queryVec) return [];
  try {
    const r = await milvusClient.search({
      collection_name: COLLECTION_NAME,
      vectors: [queryVec],
      output_fields: ["image_fingerprint", "link_text"],
      top_k: topK,
      metric_type: "IP",
      vector_type: "float",
      vector_field_name: "embedding",
    });
    return r.results || [];
  } catch (e) {
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
