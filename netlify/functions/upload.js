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
    const contentTypeLine = filePart.split("\r\n")[1];
    const fileType = contentTypeLine.split(": ")[1];

    const fileData = filePart.split("\r\n\r\n")[1].split("\r\n")[0];
    const fileBuffer = Buffer.from(fileData, "binary");

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(fileBuffer);
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: uploadResult.secure_url }),
    };
  } catch (uploadErr) {
    console.error("Cloudinary upload error:", uploadErr);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Upload to Cloudinary failed",
        details: uploadErr.message || uploadErr.toString() || "Unknown error"
      }),
    };
  }
};
