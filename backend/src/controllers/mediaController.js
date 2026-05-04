import mongoose from "mongoose";
import ReferenceImage from "../models/ReferenceImage.js";
import PremadeModel from "../models/PremadeModel.js";
import { deleteUploadedFile, getCloudinaryFolders, uploadImageBuffer } from "../lib/cloudinary.js";

function requireImageFile(req, res) {
  if (!req.file) {
    res.status(400).json({ error: "Image file is required" });
    return null;
  }

  return req.file;
}

function serializeReferenceImage(item) {
  return {
    id: item._id.toString(),
    title: item.title,
    image: item.image,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function serializePremadeModel(item) {
  return {
    id: item._id.toString(),
    title: item.title,
    description: item.description,
    priceHuf: item.priceHuf,
    size: item.size,
    image: item.image,
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

export async function listReferenceImages(_req, res) {
  const items = await ReferenceImage.find().sort({ createdAt: -1 }).limit(200).lean();

  return res.json({
    items: items.map(serializeReferenceImage),
  });
}

export async function createReferenceImage(req, res) {
  const title = String(req.body?.title || "").trim();
  const file = requireImageFile(req, res);

  if (!file) {
    return;
  }

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const uploadedImage = await uploadImageBuffer(file.buffer, file.originalname, getCloudinaryFolders().referencePics);
  const item = await ReferenceImage.create({
    title,
    image: buildImagePayload(file, uploadedImage),
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

  await deleteUploadedFile(item.image?.publicId, item.image?.resourceType || "image");
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
  const file = requireImageFile(req, res);

  if (!file) {
    return;
  }

  if (!title || !description || !size) {
    return res.status(400).json({ error: "Title, description, and size are required" });
  }

  if (!Number.isFinite(priceHuf) || priceHuf < 0) {
    return res.status(400).json({ error: "Valid price is required" });
  }

  const uploadedImage = await uploadImageBuffer(file.buffer, file.originalname, getCloudinaryFolders().premadeItems);
  const item = await PremadeModel.create({
    title,
    description,
    priceHuf,
    size,
    image: buildImagePayload(file, uploadedImage),
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

  await deleteUploadedFile(item.image?.publicId, item.image?.resourceType || "image");
  await item.deleteOne();

  return res.status(204).send();
}
