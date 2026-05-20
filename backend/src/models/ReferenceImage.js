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

const referenceImageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
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

referenceImageSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const ReferenceImage =
  mongoose.models.ReferenceImage || mongoose.model("ReferenceImage", referenceImageSchema);

export default ReferenceImage;
