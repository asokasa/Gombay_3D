import path from "path";
import mongoose from "mongoose";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import QuoteRequest from "../models/QuoteRequest.js";
import { sendQuoteRequestNotification } from "../lib/email.js";
import { uploadRawFileBuffer } from "../lib/cloudinary.js";

const SUPPORTED_EXTENSIONS = new Set([".stl", ".obj", ".step", ".stp", ".gltf", ".glb"]);

function parseJsonField(value, fallbackValue) {
  if (!value) {
    return fallbackValue;
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
  const { name, email, address, message = "", unitOverride = "auto", detectedUnitLabel = "" } = req.body;

  if (!name || !email || !address) {
    return res.status(400).json({ error: "Name, email, and address are required" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "3D model file is required" });
  }

  const extension = path.extname(req.file.originalname || "").toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    return res.status(400).json({ error: "Unsupported file extension" });
  }

  const selectedMaterial = parseJsonField(req.body.selectedMaterial, {});
  const analysis = parseJsonField(req.body.analysis, {});
  const quote = parseJsonField(req.body.quote, {});
  const scaledSizeCm = normalizeNumberArray(parseJsonField(req.body.scaledSizeCm, []));

  const uploadedFile = await uploadRawFileBuffer(req.file.buffer, req.file.originalname);
  const quoteRequestId = new mongoose.Types.ObjectId();
  const downloadPath = buildDownloadPath(quoteRequestId.toString());

  const created = await QuoteRequest.create({
    _id: quoteRequestId,
    customer: {
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      address: String(address).trim(),
      message: String(message || "").trim(),
    },
    file: {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype || "",
      sizeBytes: req.file.size,
      url: uploadedFile.secure_url,
      downloadPath,
      publicId: uploadedFile.public_id,
      resourceType: uploadedFile.resource_type || "raw",
      format: uploadedFile.format || "",
    },
    material: {
      key: selectedMaterial.key || "",
      label: selectedMaterial.label || "",
      description: selectedMaterial.description || "",
      temperature: selectedMaterial.temperature || "",
      priceHufPerGram: Number.isFinite(Number(selectedMaterial.priceHufPerGram))
        ? Number(selectedMaterial.priceHufPerGram)
        : null,
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

  const items = await QuoteRequest.find().sort({ createdAt: -1 }).limit(limit).lean();

  return res.json({
    items: items.map((item) => ({
      id: item._id.toString(),
      customer: item.customer,
      file: item.file,
      material: item.material,
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

  const originalName = item.file.originalName || `quote-request-${item._id.toString()}`;
  const safeFileName = sanitizeDownloadFileName(originalName);

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(originalName)}`,
  );
  res.setHeader(
    "Content-Type",
    item.file.mimeType || upstream.headers.get("content-type") || "application/octet-stream",
  );

  if (Number.isFinite(Number(item.file.sizeBytes)) && Number(item.file.sizeBytes) > 0) {
    res.setHeader("Content-Length", String(item.file.sizeBytes));
  }

  await pipeline(Readable.fromWeb(upstream.body), res);
}
