const cloudinary = require("cloudinary").v2;
const Busboy = require("busboy");

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

  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: {
        "content-type": event.headers["content-type"] || event.headers["Content-Type"],
      },
    });

    let fileUpload = null;

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      const cloudStream = cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        (error, result) => {
          if (error) {
            console.error("Cloudinary error", error);
            reject({
              statusCode: 500,
              body: JSON.stringify({ error: "Upload failed" }),
            });
          } else {
            resolve({
              statusCode: 200,
              body: JSON.stringify({ url: result.secure_url }),
            });
          }
        }
      );

      file.pipe(cloudStream);
    });

    busboy.write(Buffer.from(event.body, "base64"));
    busboy.end();
  });
};
