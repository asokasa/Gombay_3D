import path from "path";
import mongoose from "mongoose";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import QuoteRequest from "../models/QuoteRequest.js";
import { sendQuoteRequestNotification } from "../lib/email.js";
import { deleteUploadedFile, uploadRawFileBuffer } from "../lib/cloudinary.js";

const SUPPORTED_EXTENSIONS = new Set([
  ".stl",
  ".obj",
  ".step",
  ".stp",
  ".gltf",
  ".glb",
]);
const ADMIN_STATUS_VALUES = new Set([
  "new",
  "in_progress",
  "approved",
  "done",
  "archived",
]);

function parseJsonField(value, fallbackValue) {
  if (!value) {
    return fallbackValue;
  }
  if (typeof value === "object") {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallbackValue;
  }
}

function normalizeNumberArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item))
    .slice(0, 3);
}

function buildDownloadPath(id) {
  return `/admin/quote-requests/${id}/download`;
}

function sanitizeDownloadFileName(value) {
  return String(value || "download")
    .replace(/[\r\n"]/g, "")
    .replace(/[\\/]/g, "_");
}

export async function createQuoteRequest(req, res) {
  const {
    name,
    email,
    address,
    message = "",
    unitOverride = "auto",
    detectedUnitLabel = "",
  } = req.body;
  const requestType =
    String(req.body?.requestType || "custom").trim() === "premade"
      ? "premade"
      : "custom";

  if (!name || !email || !address) {
    return res
      .status(400)
      .json({ error: "Name, email, and address are required" });
  }

  if (requestType === "custom" && !req.file) {
    return res.status(400).json({ error: "3D model file is required" });
  }

  if (req.file) {
    const extension = path.extname(req.file.originalname || "").toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      return res.status(400).json({ error: "Unsupported file extension" });
    }
  }

  const selectedMaterial = parseJsonField(req.body.selectedMaterial, {});
  const selectedColor = parseJsonField(req.body.selectedColor, {});
  const premadeModel = parseJsonField(req.body.premadeModel, {});
  const analysis = parseJsonField(req.body.analysis, {});
  const quote = parseJsonField(req.body.quote, {});
  const scaledSizeCm = normalizeNumberArray(
    parseJsonField(req.body.scaledSizeCm, []),
  );

  if (requestType === "premade" && !String(premadeModel.title || "").trim()) {
    return res.status(400).json({ error: "Premade model is required" });
  }

  const quoteRequestId = new mongoose.Types.ObjectId();
  const uploadedFile = req.file
    ? await uploadRawFileBuffer(req.file.buffer, req.file.originalname)
    : null;
  const downloadPath = uploadedFile
    ? buildDownloadPath(quoteRequestId.toString())
    : "";

  const created = await QuoteRequest.create({
    _id: quoteRequestId,
    requestType,
    customer: {
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      address: String(address).trim(),
      message: String(message || "").trim(),
    },
    file: {
      originalName: req.file?.originalname || "",
      mimeType: req.file?.mimetype || "",
      sizeBytes: req.file?.size || 0,
      url: uploadedFile?.secure_url || "",
      downloadPath,
      publicId: uploadedFile?.public_id || "",
      resourceType: uploadedFile?.resource_type || "raw",
      format: uploadedFile?.format || "",
    },
    material: {
      key: selectedMaterial.key || "",
      label: selectedMaterial.label || "",
      description: selectedMaterial.description || "",
      temperature: selectedMaterial.temperature || "",
      priceHufPerGram: Number.isFinite(Number(selectedMaterial.priceHufPerGram))
        ? Number(selectedMaterial.priceHufPerGram)
        : null,
      color: {
        name: selectedColor.name || selectedMaterial.color?.name || "",
        hex: selectedColor.hex || selectedMaterial.color?.hex || "",
      },
    },
    premadeModel: {
      id: String(premadeModel.id || ""),
      title: String(premadeModel.title || "").trim(),
      description: String(premadeModel.description || "").trim(),
      priceHuf: Number.isFinite(Number(premadeModel.priceHuf))
        ? Number(premadeModel.priceHuf)
        : null,
      size: String(premadeModel.size || "").trim(),
      imageUrl:
        typeof premadeModel.image === "string"
          ? premadeModel.image
          : String(premadeModel.image?.url || premadeModel.imageUrl || ""),
    },
    analysis,
    quote,
    scaledSizeCm,
    unitOverride: String(unitOverride || "auto"),
    detectedUnitLabel: String(detectedUnitLabel || ""),
  });

  try {
    await sendQuoteRequestNotification(created.toObject());
  } catch (error) {
    console.error("Failed to send quote request notification email", error);
  }

  return res.status(201).json({
    id: created._id.toString(),
    fileUrl: created.file.url,
    downloadPath: created.file.downloadPath,
    createdAt: created.createdAt,
  });
}

export async function listQuoteRequests(req, res) {
  const requestedLimit = Number(req.query.limit);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 250)
    : 100;
  const requestedStatus = String(req.query.status || "").trim();
  const filter = ADMIN_STATUS_VALUES.has(requestedStatus)
    ? { status: requestedStatus }
    : {};

  const items = await QuoteRequest.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return res.json({
    items: items.map((item) => ({
      id: item._id.toString(),
      requestType: item.requestType,
      customer: item.customer,
      file: item.file,
      material: item.material,
      premadeModel: item.premadeModel,
      analysis: item.analysis,
      quote: item.quote,
      scaledSizeCm: item.scaledSizeCm,
      unitOverride: item.unitOverride,
      detectedUnitLabel: item.detectedUnitLabel,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
  });
}

export async function updateQuoteRequestStatus(req, res) {
  const { id } = req.params;
  const status = String(req.body?.status || "").trim();

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid quote request id" });
  }

  if (!ADMIN_STATUS_VALUES.has(status)) {
    return res.status(400).json({ error: "Invalid quote request status" });
  }

  const item = await QuoteRequest.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true },
  ).lean();

  if (!item) {
    return res.status(404).json({ error: "Quote request not found" });
  }

  return res.json({
    item: {
      id: item._id.toString(),
      requestType: item.requestType,
      customer: item.customer,
      file: item.file,
      material: item.material,
      premadeModel: item.premadeModel,
      analysis: item.analysis,
      quote: item.quote,
      scaledSizeCm: item.scaledSizeCm,
      unitOverride: item.unitOverride,
      detectedUnitLabel: item.detectedUnitLabel,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    },
  });
}

export async function deleteQuoteRequest(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid quote request id" });
  }

  const item = await QuoteRequest.findById(id);

  if (!item) {
    return res.status(404).json({ error: "Quote request not found" });
  }

  if (item.file?.publicId) {
    await deleteUploadedFile(item.file.publicId, item.file.resourceType);
  }

  await item.deleteOne();

  return res.status(204).send();
}

export async function downloadQuoteRequestFile(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid quote request id" });
  }

  const item = await QuoteRequest.findById(id).lean();

  if (!item) {
    return res.status(404).json({ error: "Quote request not found" });
  }

  if (!item.file?.url) {
    return res.status(404).json({ error: "Uploaded file not found" });
  }

  const upstream = await fetch(item.file.url);

  if (!upstream.ok || !upstream.body) {
    const error = new Error("Failed to download the uploaded file");
    error.statusCode = 502;
    throw error;
  }

  const originalName =
    item.file.originalName || `quote-request-${item._id.toString()}`;
  const safeFileName = sanitizeDownloadFileName(originalName);

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(originalName)}`,
  );
  res.setHeader(
    "Content-Type",
    item.file.mimeType ||
      upstream.headers.get("content-type") ||
      "application/octet-stream",
  );

  if (
    Number.isFinite(Number(item.file.sizeBytes)) &&
    Number(item.file.sizeBytes) > 0
  ) {
    res.setHeader("Content-Length", String(item.file.sizeBytes));
  }

  await pipeline(Readable.fromWeb(upstream.body), res);
}
