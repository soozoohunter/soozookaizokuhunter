require('dotenv').config();
const vision = require('@google-cloud/vision');
const axios = require('axios');

async function main() {
  const image = process.argv[2];
  if (!image) {
    console.error('Usage: node test-reverse-image.js <IMAGE_URL_OR_PATH>');
    process.exit(1);
  }

  try {
    const client = new vision.ImageAnnotatorClient();
    const [visionResult] = await client.labelDetection(image);
    console.log('Google Vision result:', JSON.stringify(visionResult.labelAnnotations, null, 2));

    const tineyeKey = process.env.TINEYE_API_KEY;
    if (!tineyeKey) throw new Error('TINEYE_API_KEY is not set');
    const tineyeRes = await axios.get('https://api.tineye.com/rest/search/', {
      params: { api_key: tineyeKey, url: image }
    });
    console.log('TinEye result:', JSON.stringify(tineyeRes.data, null, 2));
  } catch (err) {
    console.error('Error:', err.stack || err);
  }
}

main();
