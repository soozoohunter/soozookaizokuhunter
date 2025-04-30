const { MilvusClient, DataType } = require('@zilliz/milvus2-sdk-node');

// 支援 .env 或 fallback 至 docker-compose 預設名稱
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || `${process.env.MILVUS_HOST || 'suzoo_milvus'}:${process.env.MILVUS_PORT || '19530'}`;

const milvusClient = new MilvusClient({ address: MILVUS_ADDRESS });
const COLLECTION_NAME = 'aggregator_links';
const VECTOR_DIM = 384; // 根據 all-MiniLM-L6-v2 模型

async function initCollection() {
  try {
    const has = await milvusClient.hasCollection({ collection_name: COLLECTION_NAME });
    if (!has.value) {
      await milvusClient.createCollection({
        collection_name: COLLECTION_NAME,
        fields: [
          {
            name: 'link_id',
            data_type: DataType.Int64,
            is_primary_key: true,
            autoID: true,
          },
          {
            name: 'image_fingerprint',
            data_type: DataType.VarChar,
            max_length: 200,
          },
          {
            name: 'link_text',
            data_type: DataType.VarChar,
            max_length: 2000,
          },
          {
            name: 'embedding',
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

      console.log(`[Milvus] Index + Load success`);
    }
  } catch (err) {
    console.error('[initCollection] error =>', err.message || err);
  }
}

async function insertAggregatorLinks({ fingerprint, linkArray, embedFunction }) {
  if (!Array.isArray(linkArray) || linkArray.length === 0) return;

  const dataList = [];

  for (const link of linkArray) {
    try {
      const vec = await embedFunction(link);
      if (Array.isArray(vec)) {
        dataList.push({
          image_fingerprint: fingerprint,
          link_text: link,
          embedding: vec,
        });
      } else {
        console.warn('[insertAggregatorLinks] invalid vector => skip:', link);
      }
    } catch (err) {
      console.warn('[insertAggregatorLinks] embedding fail =>', err.message || err);
    }
  }

  if (dataList.length === 0) {
    console.warn('[insertAggregatorLinks] no valid data => abort');
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
    console.log('[insertAggregatorLinks] Insert OK:', r);
  } catch (err) {
    console.error('[insertAggregatorLinks] Insert Error =>', err.message || err);
  }
}

async function getLinksByFingerprint(fingerprint) {
  try {
    const r = await milvusClient.query({
      collection_name: COLLECTION_NAME,
      expr: `image_fingerprint == "${fingerprint}"`,
      output_fields: ['link_text', 'embedding'],
    });
    return r.data || [];
  } catch (err) {
    console.error('[getLinksByFingerprint] error =>', err.message || err);
    return [];
  }
}

async function searchLinksByText(queryText, embedFunction, topK = 5) {
  try {
    const queryVec = await embedFunction(queryText);
    if (!Array.isArray(queryVec)) throw new Error('Embedding failed or invalid');

    const r = await milvusClient.search({
      collection_name: COLLECTION_NAME,
      vectors: [queryVec],
      output_fields: ['image_fingerprint', 'link_text'],
      top_k: topK,
      metric_type: 'IP',
      vector_type: 'float',
      vector_field_name: 'embedding',
    });

    return r.results || [];
  } catch (err) {
    console.error('[searchLinksByText] error =>', err.message || err);
    return [];
  }
}

module.exports = {
  initCollection,
  insertAggregatorLinks,
  getLinksByFingerprint,
  searchLinksByText,
};
