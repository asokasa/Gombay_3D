import mongoose from "mongoose";

const quoteRequestSchema = new mongoose.Schema(
  {
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      address: { type: String, required: true, trim: true },
      message: { type: String, default: "", trim: true },
    },
    file: {
      originalName: { type: String, required: true },
      mimeType: { type: String, default: "" },
      sizeBytes: { type: Number, required: true },
      url: { type: String, required: true },
      downloadPath: { type: String, default: "" },
      publicId: { type: String, required: true },
      resourceType: { type: String, default: "raw" },
      format: { type: String, default: "" },
    },
    material: {
      key: { type: String, default: "" },
      label: { type: String, default: "" },
      description: { type: String, default: "" },
      temperature: { type: String, default: "" },
      priceHufPerGram: { type: Number, default: null },
      color: {
        name: { type: String, default: "" },
        hex: { type: String, default: "" },
      },
    },
    analysis: { type: mongoose.Schema.Types.Mixed, default: {} },
    quote: { type: mongoose.Schema.Types.Mixed, default: {} },
    scaledSizeCm: { type: [Number], default: [] },
    unitOverride: { type: String, default: "auto" },
    detectedUnitLabel: { type: String, default: "" },
    status: {
      type: String,
      enum: ["new", "in_progress", "approved", "done", "archived"],
      default: "new",
    },
  },
  { timestamps: true },
);

quoteRequestSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const QuoteRequest =
  mongoose.models.QuoteRequest || mongoose.model("QuoteRequest", quoteRequestSchema);

export default QuoteRequest;
