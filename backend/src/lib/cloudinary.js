import path from "path";
import { v2 as cloudinary } from "cloudinary";

let isConfigured = false;
const DEFAULT_ROOT_FOLDER = "gombay3d";
const DEFAULT_SUBFOLDERS = {
  quoteRequests: "quote_requests",
  referencePics: "reference_pics",
  premadeItems: "premade_items",
};

function normalizePublicIdBase(input) {
  const normalized = input.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/-+/g, "-").trim();
  return normalized.slice(0, 64) || "model";
}

function joinFolderPath(...parts) {
  return parts
    .filter(Boolean)
    .map((part) => String(part).trim().replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}

export function hasCloudinaryCredentials() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export function getCloudinaryFolders() {
  const root = joinFolderPath(process.env.CLOUDINARY_ROOT_FOLDER || DEFAULT_ROOT_FOLDER);
  const quoteRequests = joinFolderPath(
    process.env.CLOUDINARY_QUOTE_REQUESTS_FOLDER || process.env.CLOUDINARY_FOLDER || root,
    process.env.CLOUDINARY_QUOTE_REQUESTS_FOLDER || process.env.CLOUDINARY_FOLDER ? "" : DEFAULT_SUBFOLDERS.quoteRequests,
  );
  const referencePics = joinFolderPath(root, process.env.CLOUDINARY_REFERENCE_PICS_FOLDER || DEFAULT_SUBFOLDERS.referencePics);
  const premadeItems = joinFolderPath(root, process.env.CLOUDINARY_PREMADE_ITEMS_FOLDER || DEFAULT_SUBFOLDERS.premadeItems);

  return {
    root,
    quoteRequests,
    referencePics,
    premadeItems,
  };
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

function isAlreadyExistingFolderError(error) {
  const message = String(error?.message || "").toLowerCase();
  const httpCode = Number(error?.http_code || error?.statusCode || 0);

  return httpCode === 409 || message.includes("already exists");
}

export async function ensureCloudinaryFolders() {
  configureCloudinary();

  const folders = getCloudinaryFolders();
  const folderPaths = [folders.root, folders.quoteRequests, folders.referencePics, folders.premadeItems];

  for (const folderPath of folderPaths) {
    try {
      await cloudinary.api.create_folder(folderPath);
    } catch (error) {
      if (isAlreadyExistingFolderError(error)) {
        continue;
      }
      throw error;
    }
  }
}

export async function uploadRawFileBuffer(buffer, originalFileName) {
  configureCloudinary();

  const folder = getCloudinaryFolders().quoteRequests;
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
