const { indexImage, searchLocalImage } = require('./vectorSearch');

/**
 * Wrapper service for Milvus image operations.
 * Provides indexImage for inserting images into vector DB
 * and findSimilarImages for searching similar images.
 */
async function findSimilarImages(localFilePath, topK = 5) {
  const result = await searchLocalImage(localFilePath, topK);
  if (!result || !Array.isArray(result.results)) {
    return [];
  }
  return result.results.map(r => ({
    id: r.id ?? r.fileId ?? r.file_id,
    distance: typeof r.score === 'number' ? r.score : r.distance
  }));
}

module.exports = {
  indexImage,
  findSimilarImages
};
