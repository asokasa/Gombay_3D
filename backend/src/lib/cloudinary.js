import path from "path";
import { v2 as cloudinary } from "cloudinary";

let isConfigured = false;

function normalizePublicIdBase(input) {
  const normalized = input.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/-+/g, "-").trim();
  return normalized.slice(0, 64) || "model";
}

function configureCloudinary() {
  if (isConfigured) {
    return;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const error = new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
    error.statusCode = 500;
    throw error;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  isConfigured = true;
}

export async function uploadRawFileBuffer(buffer, originalFileName) {
  configureCloudinary();

  const folder = process.env.CLOUDINARY_FOLDER || "gombay-3d/quote-requests";
  const parsedName = path.parse(originalFileName || "model");
  const publicIdBase = normalizePublicIdBase(parsedName.name);
  const publicId = `${publicIdBase}-${Date.now()}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder,
        public_id: publicId,
        use_filename: false,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
}
