const vision = require('@google-cloud/vision');
const path = require('path');

(async () => {
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.resolve(__dirname, '../../credentials/gcp-vision.json');
  const client = new vision.ImageAnnotatorClient({ keyFilename: keyFile });

  const img = path.resolve(__dirname, '../../preCollectedImages/brandA_logo1.jpg');
  try {
    const [result] = await client.labelDetection(img);
    const labels = (result.labelAnnotations || []).map(l => l.description);
    console.log('Vision labels:', labels.slice(0, 3));
  } catch (err) {
    console.error('Vision test failed:', err.message);
    process.exit(1);
  }
})();
