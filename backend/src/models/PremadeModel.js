import mongoose from "mongoose";

const uploadedImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    originalName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    sizeBytes: { type: Number, default: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    format: { type: String, default: "" },
    resourceType: { type: String, default: "image" },
  },
  { _id: false },
);

const premadeModelSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 400,
    },
    priceHuf: {
      type: Number,
      required: true,
      min: 0,
    },
    size: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    image: uploadedImageSchema,
    images: {
      type: [uploadedImageSchema],
      default: [],
      validate: {
        validator: (images) => images.length <= 3,
        message: "You can upload up to 3 images",
      },
    },
  },
  { timestamps: true },
);

premadeModelSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const PremadeModel =
  mongoose.models.PremadeModel || mongoose.model("PremadeModel", premadeModelSchema);

export default PremadeModel;
