const { create } = require('ipfs-http-client');

const ipfs = create({ url: 'http://ipfs:5001/api/v0' });

async function uploadToIPFS(fileBuffer) {
  const result = await ipfs.add(fileBuffer);
  return result.cid.toString();
}

module.exports = { uploadToIPFS };
