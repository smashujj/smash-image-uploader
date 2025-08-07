const cloudinary = require("cloudinary").v2;
const { IncomingForm } = require("formidable");
const fs = require("fs");

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // Required to parse multipart form data
  const form = new IncomingForm({ multiples: false });


  return new Promise((resolve, reject) => {
    form.parse(event, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        resolve({
          statusCode: 400,
          body: JSON.stringify({ error: "Form parse failed" }),
        });
        return;
      }

      const uploadedFile = files.image;

      if (!uploadedFile) {
        resolve({
          statusCode: 400,
          body: JSON.stringify({ error: "No file uploaded" }),
        });
        return;
      }

      try {
        const uploadResult = await cloudinary.uploader.upload(uploadedFile.filepath, {
          resource_type: "image",
        });

        resolve({
          statusCode: 200,
          body: JSON.stringify({ url: uploadResult.secure_url }),
        });
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: "Upload to Cloudinary failed" }),
        });
      }
    });
  });
};
