import FilamentOption from "../models/FilamentOption.js";
import defaultFilaments from "./defaultFilaments.js";

export default async function ensureDefaultFilaments() {
  const existingCount = await FilamentOption.estimatedDocumentCount();

  if (existingCount > 0) {
    return;
  }

  await FilamentOption.insertMany(defaultFilaments, { ordered: true });
}
