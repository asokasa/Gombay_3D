import mongoose from "mongoose";
import FilamentOption from "../models/FilamentOption.js";

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

function buildKey(value, fallback) {
  const source = String(value || fallback || "").trim();
  return source
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase()
    .slice(0, 40);
}

function parseNumber(value, fallback = null) {
  if (value === "" || value === null || typeof value === "undefined") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeColors(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => ({
      name: String(item?.name || "").trim(),
      hex: String(item?.hex || "").trim(),
    }))
    .filter((item) => item.name && HEX_COLOR_PATTERN.test(item.hex))
    .slice(0, 40);
}

function buildFilamentPayload(body) {
  const label = String(body?.label || "").trim();
  const key = buildKey(body?.key, label);
  const density = parseNumber(body?.density);
  const materialMultiplier = parseNumber(body?.materialMultiplier);
  const machineMultiplier = parseNumber(body?.machineMultiplier);
  const priceHufPerGram = parseNumber(body?.priceHufPerGram);
  const sortOrder = parseNumber(body?.sortOrder, 0);

  if (!key || !label) {
    return { error: "Filament key and label are required" };
  }

  if (
    !Number.isFinite(density) ||
    density <= 0 ||
    !Number.isFinite(materialMultiplier) ||
    materialMultiplier <= 0 ||
    !Number.isFinite(machineMultiplier) ||
    machineMultiplier <= 0 ||
    !Number.isFinite(priceHufPerGram) ||
    priceHufPerGram < 0
  ) {
    return { error: "Density, multipliers, and price must be valid numbers" };
  }

  return {
    key,
    label,
    description: String(body?.description || "").trim(),
    temperature: String(body?.temperature || "").trim(),
    density,
    materialMultiplier,
    machineMultiplier,
    priceHufPerGram,
    colors: normalizeColors(body?.colors),
    sortOrder,
  };
}

function serializeFilament(item) {
  return {
    id: item._id.toString(),
    key: item.key,
    label: item.label,
    description: item.description || "",
    temperature: item.temperature || "",
    density: item.density,
    materialMultiplier: item.materialMultiplier,
    machineMultiplier: item.machineMultiplier,
    priceHufPerGram: item.priceHufPerGram,
    colors: item.colors || [],
    sortOrder: item.sortOrder || 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function listFilaments(_req, res) {
  const items = await FilamentOption.find().sort({ sortOrder: 1, label: 1 }).limit(200).lean();

  return res.json({
    items: items.map(serializeFilament),
  });
}

export async function createFilament(req, res) {
  const payload = buildFilamentPayload(req.body);

  if (payload.error) {
    return res.status(400).json({ error: payload.error });
  }

  try {
    const item = await FilamentOption.create(payload);
    return res.status(201).json({ item: serializeFilament(item) });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: "A filament with this key already exists" });
    }
    throw error;
  }
}

export async function updateFilament(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid filament id" });
  }

  const payload = buildFilamentPayload(req.body);

  if (payload.error) {
    return res.status(400).json({ error: payload.error });
  }

  try {
    const item = await FilamentOption.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).lean();

    if (!item) {
      return res.status(404).json({ error: "Filament not found" });
    }

    return res.json({ item: serializeFilament(item) });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: "A filament with this key already exists" });
    }
    throw error;
  }
}

export async function deleteFilament(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid filament id" });
  }

  const item = await FilamentOption.findById(id);

  if (!item) {
    return res.status(404).json({ error: "Filament not found" });
  }

  await item.deleteOne();

  return res.status(204).send();
}
