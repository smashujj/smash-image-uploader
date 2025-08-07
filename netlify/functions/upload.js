const cloudinary = require("cloudinary").v2;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const contentType = event.headers["content-type"] || event.headers["Content-Type"];
    const boundary = contentType.split("boundary=")[1];

    const bodyBuffer = Buffer.from(event.body, "base64");
    const parts = bodyBuffer.toString().split(`--${boundary}`);

    const filePart = parts.find(part => part.includes("filename="));

    const fileBase64 = filePart
      .split("\r\n\r\n")[1]
      .split("\r\n")[0];

    const buffer = Buffer.from(fileBase64, "binary");

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      (error, result) => {
        if (error) {
          throw error;
        }
        return result;
      }
    );

    // Upload using a stream
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      (error, result) => {
        if (error) {
          console.error("Upload error", error);
        }
        return result;
      }
    );
    stream.end(buffer);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("Upload failed", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process image" }),
    };
  }
};
