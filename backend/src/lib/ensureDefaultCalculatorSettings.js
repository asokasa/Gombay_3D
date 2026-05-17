import CalculatorSettings from "../models/CalculatorSettings.js";
import defaultCalculatorSettings from "./defaultCalculatorSettings.js";

export default async function ensureDefaultCalculatorSettings() {
  await CalculatorSettings.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: defaultCalculatorSettings },
    { new: true, upsert: true, runValidators: true },
  );
}
