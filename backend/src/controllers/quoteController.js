import path from "path";
import QuoteRequest from "../models/QuoteRequest.js";
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

  const created = await QuoteRequest.create({
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

  return res.status(201).json({
    id: created._id.toString(),
    fileUrl: created.file.url,
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
