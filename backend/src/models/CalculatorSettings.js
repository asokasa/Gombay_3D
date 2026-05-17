import mongoose from "mongoose";
import defaultCalculatorSettings from "../lib/defaultCalculatorSettings.js";

const calculatorSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "default",
    },
    serviceFeeHuf: {
      type: Number,
      required: true,
      min: 0,
      default: defaultCalculatorSettings.serviceFeeHuf,
    },
    machineRateHufPerHour: {
      type: Number,
      required: true,
      min: 0,
      default: defaultCalculatorSettings.machineRateHufPerHour,
    },
    fallbackMaterialCostHufPerCm3: {
      type: Number,
      required: true,
      min: 0,
      default: defaultCalculatorSettings.fallbackMaterialCostHufPerCm3,
    },
    finishingCostHufPerCm2: {
      type: Number,
      required: true,
      min: 0,
      default: defaultCalculatorSettings.finishingCostHufPerCm2,
    },
    printSpeedCm3PerHour: {
      type: Number,
      required: true,
      min: 0.01,
      default: defaultCalculatorSettings.printSpeedCm3PerHour,
    },
    infillFactor: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: defaultCalculatorSettings.infillFactor,
    },
    minimumPrintHours: {
      type: Number,
      required: true,
      min: 0,
      default: defaultCalculatorSettings.minimumPrintHours,
    },
  },
  { timestamps: true },
);

calculatorSettingsSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const CalculatorSettings =
  mongoose.models.CalculatorSettings ||
  mongoose.model("CalculatorSettings", calculatorSettingsSchema);

export default CalculatorSettings;
