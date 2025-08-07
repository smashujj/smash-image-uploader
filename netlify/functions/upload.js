const cloudinary = require('cloudinary').v2;
const formidable = require('formidable');
const { Readable } = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' })
      };
    }

    return new Promise((resolve) => {
      const form = new formidable.IncomingForm({ keepExtensions: true });

      const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
      const req = new Readable();
      req.push(bodyBuffer);
      req.push(null);
      req.headers = event.headers;

      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Form parse error:', err);
          return resolve({
            statusCode: 500,
            body: JSON.stringify({ error: 'Form parse failed', details: err.message })
          });
        }

        const file = files.file;
        if (!file || !file.filepath) {
          return resolve({
            statusCode: 400,
            body: JSON.stringify({ error: 'No file uploaded' })
          });
        }

        try {
          const uploadResponse = await cloudinary.uploader.upload(file.filepath, {
            folder: 'smash_uploader'
          });

          return resolve({
            statusCode: 200,
            body: JSON.stringify({ url: uploadResponse.secure_url })
          });
        } catch (error) {
          console.error('Cloudinary upload failed:', error);
          return resolve({
            statusCode: 500,
            body: JSON.stringify({ error: 'Upload failed', details: error.message })
          });
        }
      });
    });

  } catch (error) {
    console.error('Top-level error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unhandled exception', details: error.message })
    };
  }
};
