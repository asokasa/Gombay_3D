import CalculatorSettings from "../models/CalculatorSettings.js";
import defaultCalculatorSettings from "../lib/defaultCalculatorSettings.js";

const SETTING_FIELDS = [
  "serviceFeeHuf",
  "machineRateHufPerHour",
  "fallbackMaterialCostHufPerCm3",
  "finishingCostHufPerCm2",
  "printSpeedCm3PerHour",
  "infillFactor",
  "minimumPrintHours",
];

function serializeSettings(item) {
  const source = item || defaultCalculatorSettings;
  return {
    id: source._id?.toString?.() ?? "",
    serviceFeeHuf: source.serviceFeeHuf,
    machineRateHufPerHour: source.machineRateHufPerHour,
    fallbackMaterialCostHufPerCm3: source.fallbackMaterialCostHufPerCm3,
    finishingCostHufPerCm2: source.finishingCostHufPerCm2,
    printSpeedCm3PerHour: source.printSpeedCm3PerHour,
    infillFactor: source.infillFactor,
    minimumPrintHours: source.minimumPrintHours,
    createdAt: source.createdAt ?? null,
    updatedAt: source.updatedAt ?? null,
  };
}

function parseSettingsPayload(body) {
  const payload = {};

  for (const field of SETTING_FIELDS) {
    const value = Number(body?.[field]);

    if (!Number.isFinite(value)) {
      return { error: "All calculator settings must be valid numbers" };
    }

    payload[field] = value;
  }

  if (
    payload.serviceFeeHuf < 0 ||
    payload.machineRateHufPerHour < 0 ||
    payload.fallbackMaterialCostHufPerCm3 < 0 ||
    payload.finishingCostHufPerCm2 < 0 ||
    payload.printSpeedCm3PerHour <= 0 ||
    payload.infillFactor < 0 ||
    payload.infillFactor > 1 ||
    payload.minimumPrintHours < 0
  ) {
    return {
      error:
        "Costs must be non-negative, print speed must be greater than zero, and infill must be between 0 and 1",
    };
  }

  return payload;
}

export async function getCalculatorSettings(_req, res) {
  const item = await CalculatorSettings.findOne({ key: "default" }).lean();

  return res.json({
    item: serializeSettings(item),
  });
}

export async function updateCalculatorSettings(req, res) {
  const payload = parseSettingsPayload(req.body);

  if (payload.error) {
    return res.status(400).json({ error: payload.error });
  }

  const item = await CalculatorSettings.findOneAndUpdate(
    { key: "default" },
    { ...payload, key: "default" },
    { new: true, upsert: true, runValidators: true },
  ).lean();

  return res.json({
    item: serializeSettings(item),
  });
}
