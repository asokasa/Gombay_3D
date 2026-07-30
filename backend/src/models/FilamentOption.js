import mongoose from "mongoose";

const filamentColorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    hex: {
      type: String,
      required: true,
      trim: true,
      match: /^#(?:[0-9a-fA-F]{3}){1,2}$/,
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const filamentOptionSchema = new mongoose.Schema(
  {
    available: {
      type: Boolean,
      default: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 40,
      unique: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 400,
    },
    temperature: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
    },
    density: {
      type: Number,
      required: true,
      min: 0.01,
    },
    materialMultiplier: {
      type: Number,
      required: true,
      min: 0.01,
    },
    machineMultiplier: {
      type: Number,
      required: true,
      min: 0.01,
    },
    priceHufPerGram: {
      type: Number,
      required: true,
      min: 0,
    },
    colors: {
      type: [filamentColorSchema],
      default: [],
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

filamentOptionSchema.index({ sortOrder: 1, label: 1 });

filamentOptionSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const FilamentOption =
  mongoose.models.FilamentOption || mongoose.model("FilamentOption", filamentOptionSchema);

export default FilamentOption;
