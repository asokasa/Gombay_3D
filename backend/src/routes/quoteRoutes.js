import { Router } from "express";
import multer from "multer";
import path from "path";
import asyncHandler from "../middleware/asyncHandler.js";
import { createQuoteRequest } from "../controllers/quoteController.js";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = new Set([".stl", ".obj", ".step", ".stp", ".gltf", ".glb"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      cb(new Error("Unsupported file extension"));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.post("/", upload.single("file"), asyncHandler(createQuoteRequest));

export default router;
