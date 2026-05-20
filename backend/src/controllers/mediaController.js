import mongoose from "mongoose";
import ReferenceImage from "../models/ReferenceImage.js";
import PremadeModel from "../models/PremadeModel.js";
import { deleteUploadedFile, getCloudinaryFolders, uploadImageBuffer } from "../lib/cloudinary.js";

const MAX_ITEM_IMAGES = 3;

function getUploadedImageFiles(req) {
  if (Array.isArray(req.files)) {
    return req.files;
  }

  if (req.files && typeof req.files === "object") {
    return Object.values(req.files).flat();
  }

  return req.file ? [req.file] : [];
}

function requireImageFiles(req, res) {
  const files = getUploadedImageFiles(req);

  if (!files.length) {
    res.status(400).json({ error: "Image file is required" });
    return null;
  }

  if (files.length > MAX_ITEM_IMAGES) {
    res.status(400).json({ error: "You can upload up to 3 images" });
    return null;
  }

  return files;
}

function normalizeImages(item) {
  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images;
  }

  return item.image?.url ? [item.image] : [];
}

function serializeReferenceImage(item) {
  const images = normalizeImages(item);
  return {
    id: item._id.toString(),
    title: item.title,
    image: images[0] ?? item.image,
    images,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function serializePremadeModel(item) {
  const images = normalizeImages(item);
  return {
    id: item._id.toString(),
    title: item.title,
    description: item.description,
    priceHuf: item.priceHuf,
    size: item.size,
    image: images[0] ?? item.image,
    images,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function buildImagePayload(file, uploadedImage) {
  return {
    url: uploadedImage.secure_url,
    publicId: uploadedImage.public_id,
    originalName: file.originalname || "",
    mimeType: file.mimetype || "",
    sizeBytes: file.size || 0,
    width: uploadedImage.width || null,
    height: uploadedImage.height || null,
    format: uploadedImage.format || "",
    resourceType: uploadedImage.resource_type || "image",
  };
}

async function uploadImageFiles(files, folder) {
  const uploadedImages = await Promise.all(
    files.map((file) => uploadImageBuffer(file.buffer, file.originalname, folder)),
  );

  return files.map((file, index) => buildImagePayload(file, uploadedImages[index]));
}

async function deleteItemImages(item) {
  const seenPublicIds = new Set();
  const images = normalizeImages(item);

  for (const image of images) {
    if (!image?.publicId || seenPublicIds.has(image.publicId)) {
      continue;
    }

    seenPublicIds.add(image.publicId);
    await deleteUploadedFile(image.publicId, image.resourceType || "image");
  }
}

export async function listReferenceImages(_req, res) {
  const items = await ReferenceImage.find().sort({ createdAt: -1 }).limit(200).lean();

  return res.json({
    items: items.map(serializeReferenceImage),
  });
}

export async function createReferenceImage(req, res) {
  const title = String(req.body?.title || "").trim();
  const files = requireImageFiles(req, res);

  if (!files) {
    return;
  }

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const images = await uploadImageFiles(files, getCloudinaryFolders().referencePics);
  const item = await ReferenceImage.create({
    title,
    image: images[0],
    images,
  });

  return res.status(201).json({ item: serializeReferenceImage(item) });
}

export async function deleteReferenceImage(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid reference image id" });
  }

  const item = await ReferenceImage.findById(id);

  if (!item) {
    return res.status(404).json({ error: "Reference image not found" });
  }

  await deleteItemImages(item);
  await item.deleteOne();

  return res.status(204).send();
}

export async function listPremadeModels(_req, res) {
  const items = await PremadeModel.find().sort({ createdAt: -1 }).limit(200).lean();

  return res.json({
    items: items.map(serializePremadeModel),
  });
}

export async function createPremadeModel(req, res) {
  const title = String(req.body?.title || "").trim();
  const description = String(req.body?.description || "").trim();
  const size = String(req.body?.size || "").trim();
  const priceHuf = Number(req.body?.priceHuf);
  const files = requireImageFiles(req, res);

  if (!files) {
    return;
  }

  if (!title || !description || !size) {
    return res.status(400).json({ error: "Title, description, and size are required" });
  }

  if (!Number.isFinite(priceHuf) || priceHuf < 0) {
    return res.status(400).json({ error: "Valid price is required" });
  }

  const images = await uploadImageFiles(files, getCloudinaryFolders().premadeItems);
  const item = await PremadeModel.create({
    title,
    description,
    priceHuf,
    size,
    image: images[0],
    images,
  });

  return res.status(201).json({ item: serializePremadeModel(item) });
}

export async function deletePremadeModel(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid model id" });
  }

  const item = await PremadeModel.findById(id);

  if (!item) {
    return res.status(404).json({ error: "Model not found" });
  }

  await deleteItemImages(item);
  await item.deleteOne();

  return res.status(204).send();
}
