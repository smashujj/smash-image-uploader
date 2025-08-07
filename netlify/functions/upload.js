const cloudinary = require("cloudinary").v2;
const Busboy = require("busboy");

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

  return new Promise((resolve, reject) => {
    const busboy = new Busboy({
      headers: {
        "content-type": event.headers["content-type"] || event.headers["Content-Type"],
      },
    });

    let fileBuffer = Buffer.alloc(0);
    let fileUploaded = false;

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      file.on("data", (data) => {
        fileBuffer = Buffer.concat([fileBuffer, data]);
      });

      file.on("end", () => {
        fileUploaded = true;
      });
    });

    busboy.on("finish", () => {
      if (!fileUploaded) {
        return resolve({
          statusCode: 400,
          body: JSON.stringify({ error: "No file uploaded" }),
        });
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        (err, result) => {
          if (err) {
            console.error("Cloudinary error:", err);
            return resolve({
              statusCode: 500,
              body: JSON.stringify({
                error: "Cloudinary upload failed",
                details: err.message,
              }),
            });
          }

          return resolve({
            statusCode: 200,
            body: JSON.stringify({ url: result.secure_url }),
          });
        }
      );

      uploadStream.end(fileBuffer);
    });

    const bodyBuffer = Buffer.from(event.body, "base64");
    busboy.end(bodyBuffer);
  });
};
